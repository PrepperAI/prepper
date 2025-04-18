from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import os
from dotenv import load_dotenv
from openai import OpenAI
from typing import Optional, List
from google.cloud import firestore
from datetime import datetime
from services.firestore_client import firestore_client as db, log_interaction
from services.redis_client import redis_client
import json
import requests
import fitz  # PyMuPDF

# Load env variables
load_dotenv()

# OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

router = APIRouter()

# ==== Resume Parsing ====
def extract_text_from_pdf_url(url: str) -> str:
    try:
        response = requests.get(url)
        if response.status_code != 200:
            raise Exception("Failed to fetch resume PDF")

        with open("temp_resume.pdf", "wb") as f:
            f.write(response.content)

        doc = fitz.open("temp_resume.pdf")
        text = "\n".join([page.get_text() for page in doc])
        doc.close()
        os.remove("temp_resume.pdf")
        return text.strip()

    except Exception as e:
        print("❌ Resume parsing error:", e)
        return "Resume not available."


# ==== Request Models ====

class BehavioralInterviewInitRequest(BaseModel):
    session_id: str
    interview_type: str
    role: str
    experience_level: str
    parsed_resume: str
    job_description: Optional[str] = ""
    company: Optional[str] = None
    stress_level: Optional[str] = "Realistic"
    style: Optional[str] = "Coach"
    focus_areas: Optional[List[str]] = []
    location: Optional[str] = ""
    user_uid: Optional[str] = None
    user_email: Optional[str] = None


class InterviewRequest(BaseModel):
    session_id: str
    message: str
    role: str
    interview_type: str
    experience_level: str
    parsed_resume: str
    company: Optional[str] = None
    stress_level: Optional[str] = "Realistic"
    style: Optional[str] = "Coach"
    focus_areas: Optional[List[str]] = []
    location: Optional[str] = ""
    user_uid: Optional[str] = "anonymous"
    user_email: Optional[str] = "unknown@example.com"

# ==== /interview/init Endpoint ====

@router.post("/interview/init")
async def init_behavioral_interview(req: BehavioralInterviewInitRequest):
    print("\U0001F44B Behavioral Interview Init")

    parsed_resume = extract_text_from_pdf_url(req.parsed_resume)

    prompt = f"""
You are playing the role of a real behavioral interviewer at {req.company or 'a top-tier company'}, not an assistant or coach.

You are a {req.style.lower()}-style behavioral interviewer preparing a candidate for a mock interview.

ONLY respond to inputs that are clearly related to the behavioral interview.
If the user's message is not a valid behavioral interview answer or question, redirect them to focus on the interview.

Maintain a professional yet approachable tone — like a human interviewer who wants the candidate to feel comfortable.

The candidate is applying for the role of {req.role} at {req.company or 'a top tech company'} with {req.experience_level} experience.
They are located in {req.location or 'an unspecified location'}, and prefer a {req.stress_level.lower()}-pressure interview environment.

Use the following job description to guide your questions (if provided):
{req.job_description or 'No job description provided.'}

Also refer to this resume when helpful:
{parsed_resume}

Your tone and expectations should reflect the interview culture of {req.company or 'top tech companies'}.

Focus areas: {", ".join(req.focus_areas or ['general behavioral topics'])}.

Start the session by:
- Warmly greeting the candidate
- Introducing yourself briefly
- Asking the candidate to introduce themselves
- Outlining the interview flow in 1 sentence

🧠 Keep your responses short and natural (like a real interviewer). Limit to 1-2 sentences max.
"""


    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a behavioral interview coach."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.7,
            max_tokens=300,
        )

        message = response.choices[0].message.content.strip()
        print("\u2705 Init Response:", message)

        uid = req.user_uid or "anonymous"
        email = req.user_email or "unknown@example.com"

        user_doc = db.collection("users").document(uid).get()
        if user_doc.exists:
            user_data = user_doc.to_dict()
            if not user_data.get("isPremium"):
                remaining = user_data.get("remainingAttempts", {}).get("behavioral", 0)
                if remaining > 0:
                    db.collection("users").document(uid).update({"remainingAttempts.behavioral": remaining - 1})
                    print(f"\U0001F7E1 Behavioral attempts left: {remaining - 1}")
                else:
                    raise HTTPException(status_code=403, detail="No behavioral interview attempts left.")
        else:
            print("\u26A0\uFE0F No user document found to decrement.")

        session_ref = db.collection("behavioral_sessions").document(uid).collection("sessions").document(req.session_id)
        session_ref.set({
            "created_at": datetime.utcnow(),
            "session_id": req.session_id,
            "user_uid": uid,
            "user_email": email,
            "interview_type": req.interview_type,
            "job_role": req.role,
            "experience_level": req.experience_level,
            "resume": req.parsed_resume,
            "job_description": req.job_description,  # ✅ NEW
            "company": req.company,
            "style": req.style,
            "stress_level": req.stress_level,
            "focus_areas": req.focus_areas,
            "location": req.location,
            "initial_message": message,
        })
        redis_key = f"behavioral_session:{req.session_id}"
        redis_client.set(redis_key, json.dumps([
            {"role": "system", "content": prompt},
            {"role": "assistant", "content": message}
        ]))
        redis_client.expire(redis_key, 3600)

        return {"response": message}

    except Exception as e:
        print("\u274C Error in init:", e)
        raise HTTPException(status_code=500, detail="Behavioral init failed.")

# ==== /interview Endpoint ====

@router.post("/interview")
async def interview(req: InterviewRequest):
    session_id = req.session_id
    uid = req.user_uid or "anonymous"
    email = req.user_email or "unknown@example.com"
    redis_key = f"behavioral_session:{session_id}"

    raw = redis_client.get(redis_key)
    messages = json.loads(raw) if raw else []

    if not messages:
        system_prompt = f"""
You are playing the role of a real behavioral interviewer at {req.company or 'a top-tier company'}, not an assistant or coach.

You are a {req.style.lower()}-style interviewer conducting a mock behavioral interview.

ONLY respond to inputs that are clearly related to the behavioral interview.
If the user's message is not a valid behavioral interview answer or question, you redirect them to focus on the interview.

Maintain a professional yet approachable tone — like a human interviewer who wants the candidate to feel comfortable.

The candidate is applying for the role of {req.role} with {req.experience_level} experience.
They are located in {req.location or 'an unspecified location'}, and prefer a {req.stress_level.lower()}-pressure environment.

Focus areas: {", ".join(req.focus_areas or ['general behavioral topics'])}.
Refer to this resume when helpful: {req.parsed_resume}

Ask one concise behavioral question or follow-up at a time.
\U0001F9E0 Keep your responses short and natural. Limit to 1-2 sentences max.
"""
        messages = [{"role": "system", "content": system_prompt}]

    messages.append({"role": "user", "content": req.message})

    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=messages,
            temperature=0.3,
            max_tokens=1024,
        )

        ai_reply = response.choices[0].message.content.strip()
    
        if ai_reply in ('', '""', "''"):
            return {"response": ""}

        messages.append({"role": "assistant", "content": ai_reply})
        redis_client.set(redis_key, json.dumps(messages))
        redis_client.expire(redis_key, 3600)

        log_interaction(
            collection="behavioral_sessions",
            user_uid=uid,
            session_id=session_id,
            interaction_data={
                "timestamp": datetime.utcnow(),
                "user_input": req.message,
                "ai_response": ai_reply,
                "role": req.role,
                "interview_type": req.interview_type,
                "experience_level": req.experience_level,
                "resume": req.parsed_resume,
                "email": email,
                "company": req.company,
                "style": req.style,
                "stress_level": req.stress_level,
                "focus_areas": req.focus_areas,
                "location": req.location,
            },
        )
        print('This is the final response',{"response": ai_reply})
        return {"response": ai_reply}

    except Exception as e:
        print("\u274C Error in interview:", e)
        raise HTTPException(status_code=500, detail="Interview failed.")


# from fastapi import APIRouter, HTTPException
# from pydantic import BaseModel
# import os
# from dotenv import load_dotenv
# from openai import OpenAI
# from typing import Optional, List
# from google.cloud import firestore
# from datetime import datetime
# from services.firestore_client import firestore_client as db, log_interaction
# from services.redis_client import redis_client
# import json
# import requests
# import fitz  # PyMuPDF

# # Load env variables
# load_dotenv()

# # OpenAI client
# client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# router = APIRouter()

# # ==== Resume Parsing ====
# def extract_text_from_pdf_url(url: str) -> str:
#     try:
#         response = requests.get(url)
#         if response.status_code != 200:
#             raise Exception("Failed to fetch resume PDF")

#         with open("temp_resume.pdf", "wb") as f:
#             f.write(response.content)

#         doc = fitz.open("temp_resume.pdf")
#         text = "\n".join([page.get_text() for page in doc])
#         doc.close()
#         os.remove("temp_resume.pdf")
#         return text.strip()

#     except Exception as e:
#         print("❌ Resume parsing error:", e)
#         return "Resume not available."


# # ==== Request Models ====

# class BehavioralInterviewInitRequest(BaseModel):
#     session_id: str
#     interview_type: str
#     role: str
#     experience_level: str
#     parsed_resume: str
#     company: Optional[str] = None
#     stress_level: Optional[str] = "Realistic"
#     style: Optional[str] = "Coach"
#     focus_areas: Optional[List[str]] = []
#     location: Optional[str] = ""
#     user_uid: Optional[str] = None
#     user_email: Optional[str] = None

# class InterviewRequest(BaseModel):
#     session_id: str
#     message: str
#     role: str
#     interview_type: str
#     experience_level: str
#     parsed_resume: str
#     company: Optional[str] = None
#     stress_level: Optional[str] = "Realistic"
#     style: Optional[str] = "Coach"
#     focus_areas: Optional[List[str]] = []
#     location: Optional[str] = ""
#     user_uid: Optional[str] = "anonymous"
#     user_email: Optional[str] = "unknown@example.com"

# # ==== /interview/init Endpoint ====

# @router.post("/interview/init")
# async def init_behavioral_interview(req: BehavioralInterviewInitRequest):
#     print("\U0001F44B Behavioral Interview Init")

#     parsed_resume = extract_text_from_pdf_url(req.parsed_resume)

#     prompt = f"""
# You are playing the role of a real behavioral interviewer at {req.company or 'a top-tier company'}, not an assistant or coach.

# You are a {req.style.lower()}-style behavioral interviewer preparing a candidate for a mock interview.

# ONLY respond to inputs that are clearly related to the behavioral interview.
# If the user's message is not a valid behavioral interview answer or question, you redirect them to focus on the interview.

# Maintain a professional yet approachable tone — like a human interviewer who wants the candidate to feel comfortable.

# The candidate is applying for the role of {req.role} at {req.company or 'a top tech company'} with {req.experience_level} experience.
# They are located in {req.location or 'an unspecified location'}, and prefer a {req.stress_level.lower()}-pressure interview environment.
# Refer to this resume when helpful:
# {parsed_resume}
# Your tone and expectations should reflect the interview culture of {req.company or 'top tech companies'}.

# Focus areas: {", ".join(req.focus_areas or ['general behavioral topics'])}.

# Start the session by:
# - Warmly greeting the candidate
# - Introducing yourself briefly
# - Asking the candidate to introduce themselves
# - Outlining the interview flow in 1 sentence


# \U0001F9E0 Keep your responses short and natural (like a real interviewer). Limit to 1-2 sentences max.
# """

#     try:
#         response = client.chat.completions.create(
#             model="gpt-3.5-turbo",
#             messages=[
#                 {"role": "system", "content": "You are a behavioral interview coach."},
#                 {"role": "user", "content": prompt},
#             ],
#             temperature=0.7,
#             max_tokens=300,
#         )

#         message = response.choices[0].message.content.strip()
#         print("\u2705 Init Response:", message)

#         uid = req.user_uid or "anonymous"
#         email = req.user_email or "unknown@example.com"

#         user_doc = db.collection("users").document(uid).get()
#         if user_doc.exists:
#             user_data = user_doc.to_dict()
#             if not user_data.get("isPremium"):
#                 remaining = user_data.get("remainingAttempts", {}).get("behavioral", 0)
#                 if remaining > 0:
#                     db.collection("users").document(uid).update({"remainingAttempts.behavioral": remaining - 1})
#                     print(f"\U0001F7E1 Behavioral attempts left: {remaining - 1}")
#                 else:
#                     raise HTTPException(status_code=403, detail="No behavioral interview attempts left.")
#         else:
#             print("\u26A0\uFE0F No user document found to decrement.")

#         session_ref = db.collection("behavioral_sessions").document(uid).collection("sessions").document(req.session_id)
#         session_ref.set({
#             "created_at": datetime.utcnow(),
#             "session_id": req.session_id,
#             "user_uid": uid,
#             "user_email": email,
#             "interview_type": req.interview_type,
#             "job_role": req.role,
#             "experience_level": req.experience_level,
#             "resume": req.parsed_resume,
#             "company": req.company,
#             "style": req.style,
#             "stress_level": req.stress_level,
#             "focus_areas": req.focus_areas,
#             "location": req.location,
#             "initial_message": message,
#         })

#         redis_key = f"behavioral_session:{req.session_id}"
#         redis_client.set(redis_key, json.dumps([
#             {"role": "system", "content": prompt},
#             {"role": "assistant", "content": message}
#         ]))
#         redis_client.expire(redis_key, 3600)

#         return {"response": message}

#     except Exception as e:
#         print("\u274C Error in init:", e)
#         raise HTTPException(status_code=500, detail="Behavioral init failed.")

# # ==== /interview Endpoint ====

# @router.post("/interview")
# async def interview(req: InterviewRequest):
#     session_id = req.session_id
#     uid = req.user_uid or "anonymous"
#     email = req.user_email or "unknown@example.com"
#     redis_key = f"behavioral_session:{session_id}"

#     raw = redis_client.get(redis_key)
#     messages = json.loads(raw) if raw else []

#     if not messages:
#         system_prompt = f"""
# You are playing the role of a real behavioral interviewer at {req.company or 'a top-tier company'}, not an assistant or coach.

# You are a {req.style.lower()}-style interviewer conducting a mock behavioral interview.

# ONLY respond to inputs that are clearly related to the behavioral interview.
# If the user's message is not a valid behavioral interview answer or question, you redirect them to focus on the interview.

# Maintain a professional yet approachable tone — like a human interviewer who wants the candidate to feel comfortable.

# The candidate is applying for the role of {req.role} with {req.experience_level} experience.
# They are located in {req.location or 'an unspecified location'}, and prefer a {req.stress_level.lower()}-pressure environment.

# Focus areas: {", ".join(req.focus_areas or ['general behavioral topics'])}.
# Refer to this resume when helpful: {req.parsed_resume}

# Ask one concise behavioral question or follow-up at a time.
# \U0001F9E0 Keep your responses short and natural. Limit to 1-2 sentences max.
# """
#         messages = [{"role": "system", "content": system_prompt}]

#     messages.append({"role": "user", "content": req.message})

#     try:
#         response = client.chat.completions.create(
#             model="gpt-3.5-turbo",
#             messages=messages,
#             temperature=0.3,
#             max_tokens=1024,
#         )

#         ai_reply = response.choices[0].message.content.strip()
    
#         if ai_reply in ('', '""', "''"):
#             return {"response": ""}

#         messages.append({"role": "assistant", "content": ai_reply})
#         redis_client.set(redis_key, json.dumps(messages))
#         redis_client.expire(redis_key, 3600)

#         log_interaction(
#             collection="behavioral_sessions",
#             user_uid=uid,
#             session_id=session_id,
#             interaction_data={
#                 "timestamp": datetime.utcnow(),
#                 "user_input": req.message,
#                 "ai_response": ai_reply,
#                 "role": req.role,
#                 "interview_type": req.interview_type,
#                 "experience_level": req.experience_level,
#                 "resume": req.parsed_resume,
#                 "email": email,
#                 "company": req.company,
#                 "style": req.style,
#                 "stress_level": req.stress_level,
#                 "focus_areas": req.focus_areas,
#                 "location": req.location,
#             },
#         )
#         print('This is the final response',{"response": ai_reply})
#         return {"response": ai_reply}

#     except Exception as e:
#         print("\u274C Error in interview:", e)
#         raise HTTPException(status_code=500, detail="Interview failed.")
