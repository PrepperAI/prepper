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
import fitz  # PyMuPDF
# Load env variables
load_dotenv()

# OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

router = APIRouter()

# System message with structured interview flow
system_message = """
You are a structured but supportive system design interviewer. Follow this specific interview structure:

PHASE 1 - INTRODUCTION:
- Introduce yourself briefly as Eric
- Allow the candidate to introduce themselves
- Wait for their introduction before proceeding

PHASE 2 - QUESTION PRESENTATION:
- Present the system design question clearly
- Explicitly invite the candidate to ask clarification questions
- Answer their questions and ensure they understand the requirements

PHASE 3 - REQUIREMENTS GATHERING:
- Guide them to define functional and non-functional requirements
- Review their requirements and ask probing questions
- Help refine requirements if needed

PHASE 4 - DESIGN IMPLEMENTATION:
- Invite them to draw their system design on the canvas
- Observe their design as they work
- Ask questions about their design choices

PHASE 5 - DESIGN EVALUATION:
- When they indicate they're done, evaluate the design
- Ask specific questions about:
  * Latency considerations
  * Availability and fault tolerance
  * Maintainability and extensibility
  * Scalability (horizontal and vertical)
  * Data consistency and integrity
  * Security considerations

Keep feedback concise (max 500 characters).
Track which phase of the interview you're in and guide the candidate accordingly.
If their response isn't relevant to the system design you asked return "" and nothing else.
"""

# ==== Request Models ====

class SystemDesignInitRequest(BaseModel):
    session_id: str
    interview_type: str
    focus_system: str | None = None
    job_role: str
    candidate_level: str
    company: str | None = None
    location: str | None = None
    resume: str
    style: str
    user_email: str
    user_id: str

class SystemDesignFollowupRequest(BaseModel):
    session_id: str
    spoken_response: str
    canvas_data: list
    interview_type: str
    job_role: str
    candidate_level: str
    resume: str
    style: str
    company: str | None = None
    location: str | None = None
    user_email: str
    user_id: str
    focus_system: str | None = None

# ==== INIT Endpoint ====
# Helper: Extract text from resume PDF URL
def extract_text_from_pdf_url(url: str) -> str:
    try:
        # Download file temporarily
        import requests
        response = requests.get(url)
        if response.status_code != 200:
            raise Exception("Failed to fetch resume PDF")

        with open("temp_resume.pdf", "wb") as f:
            f.write(response.content)

        # Parse text
        doc = fitz.open("temp_resume.pdf")
        text = "\n".join([page.get_text() for page in doc])
        doc.close()
        os.remove("temp_resume.pdf")
        return text.strip()

    except Exception as e:
        print("❌ Resume parsing error:", e)
        return "Resume not available."

# @router.post("/interview/system-design/init")
# async def init_system_design_interview(req: SystemDesignInitRequest):
#     print("🧠 [System Design Init]", req.focus_system)

#     user_ref = db.collection("users").document(req.user_id)
#     user_doc = user_ref.get()
#     if not user_doc.exists:
#         raise HTTPException(status_code=404, detail="User not found in Firestore")

#     user_data = user_doc.to_dict()
#     if not user_data.get("isPremium", False):
#         attempts = user_data.get("remainingAttempts", {}).get("systemDesign", 0)
#         if attempts <= 0:
#             raise HTTPException(status_code=403, detail="No remaining System Design attempts.")
#         user_ref.update({"remainingAttempts.systemDesign": attempts - 1})
#         print(f"🟠 System Design attempt decremented: {attempts - 1}")

#     # ✅ Extract resume text
#     parsed_resume = extract_text_from_pdf_url(req.resume)
#     # ✅ Extract resume text

#     print("📄 Parsed Resume Preview:\n", parsed_resume[:1000])  # Log first 1000 characters

#     question_instruction = (
#         f"Generate a system design question specifically about {req.focus_system}, suitable for a {req.candidate_level} level candidate."
#         if req.focus_system else
#         f"Generate a system design question of your choice that is suitable for a {req.candidate_level} level candidate, based on their background."
#     )

#     prompt = f"""
#     You are playing the role of a real system design interviewer at {req.company or 'a top-tier company'}, not an assistant.
#     Maintain a professional yet friendly tone — like a real human interviewer who wants to make the candidate comfortable and confident, even if they struggle. Be clear and kind in your follow-ups, like a supportive mentor.
#     The candidate is applying for a {req.job_role} role at the {req.candidate_level} level.
#     Their preferred location is {req.location or 'not specified'}.
#     Resume Summary:
#     {parsed_resume}
#     Use the resume to personalize your greeting and tailor the system design question if applicable.
#     {question_instruction}
#     Your response should be a JSON object with exactly two fields, Do NOT wrap your response in markdown or code blocks:
#     1. "spoken_message": A short, natural introduction (max ~400 characters). Include your name and invite the candidate to introduce themselves.
#     2. "system_design_question": A concise, open-ended system design question (~10–15 words).
#     """.strip()

#     try:
#         response = client.chat.completions.create(
#             model="gpt-4o",
#             messages=[
#                 {"role": "system", "content": system_message},
#                 {"role": "user", "content": prompt}
#             ],
#             temperature=0.7,
#             max_tokens=300,
#         )

#         try:
#             raw_content = response.choices[0].message.content.strip()
#             print("🟡 GPT Raw Output:\n", repr(raw_content))

#             if not raw_content:
#                 raise ValueError("GPT response was empty")
#             parsed = json.loads(raw_content)

#         except Exception as e:
#             print("❌ GPT Init Error:", str(e))
#             raise HTTPException(status_code=500, detail="Failed to generate system design question.")

#     except Exception as e:
#         print("❌ Init error:", str(e))
#         raise HTTPException(status_code=500, detail="Failed to generate system design question.")

#     # Store history + metadata logic remains unchanged...
#     # [UNCHANGED CODE BLOCK FOLLOWS FOR LOGGING, REDIS, RETURN]

#     # ... Return same format
#     return {
#         "spoken_message": parsed.get("spoken_message", raw_content),
#         "system_design_question": parsed.get("system_design_question", ""),
#     }
@router.post("/interview/system-design/init")
async def init_system_design_interview(req: SystemDesignInitRequest):
    print("🧠 [System Design Init]", req.focus_system)

    user_ref = db.collection("users").document(req.user_id)
    user_doc = user_ref.get()
    if not user_doc.exists:
        raise HTTPException(status_code=404, detail="User not found in Firestore")

    user_data = user_doc.to_dict()
    if not user_data.get("isPremium", False):
        attempts = user_data.get("remainingAttempts", {}).get("systemDesign", 0)
        if attempts <= 0:
            raise HTTPException(status_code=403, detail="No remaining System Design attempts.")
        user_ref.update({"remainingAttempts.systemDesign": attempts - 1})
        print(f"🟠 System Design attempt decremented: {attempts - 1}")

    # ✅ Extract resume text
    parsed_resume = extract_text_from_pdf_url(req.resume)
    print("📄 Parsed Resume Preview:\n", parsed_resume[:1000])  # Log first 1000 characters

    question_instruction = (
        f"Generate a system design question specifically about {req.focus_system}, suitable for a {req.candidate_level} level candidate."
        if req.focus_system else
        f"Generate a system design question of your choice that is suitable for a {req.candidate_level} level candidate, based on their background."
    )

    prompt = f"""
    You are playing the role of a real system design interviewer at {req.company or 'a top-tier company'}, not an assistant.
    Maintain a professional yet friendly tone — like a real human interviewer who wants to make the candidate comfortable and confident, even if they struggle. Be clear and kind in your follow-ups, like a supportive mentor.
    The candidate is applying for a {req.job_role} role at the {req.candidate_level} level.
    Their preferred location is {req.location or 'not specified'}.
    Resume Summary:
    {parsed_resume}
    Use the resume to personalize your greeting and tailor the system design question if applicable.
    {question_instruction}
    Your response should be a JSON object with exactly two fields, Do NOT wrap your response in markdown or code blocks:
    1. "spoken_message": A short, natural introduction (max ~400 characters). Include your name and invite the candidate to introduce themselves.
    2. "system_design_question": A concise, open-ended system design question (~10–15 words).
    """.strip()

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_message},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=300,
        )

        try:
            raw_content = response.choices[0].message.content.strip()
            print("🟡 GPT Raw Output:\n", repr(raw_content))

            if not raw_content:
                raise ValueError("GPT response was empty")
            parsed = json.loads(raw_content)

        except Exception as e:
            print("❌ GPT Init Error:", str(e))
            raise HTTPException(status_code=500, detail="Failed to generate system design question.")

    except Exception as e:
        print("❌ Init error:", str(e))
        raise HTTPException(status_code=500, detail="Failed to generate system design question.")

    # ✅ Ensure session doc exists for feedback later
    session_ref = (
        db.collection("system_design_sessions")
        .document(req.user_id)
        .collection("sessions")
        .document(req.session_id)
    )

    session_ref.set({
        "created_at": datetime.utcnow(),
        "question": parsed.get("system_design_question", ""),
        "job_role": req.job_role,
        "candidate_level": req.candidate_level,
        "company": req.company,
        "style": req.style,
        "location": req.location,
        "resume": req.resume,
    }, merge=True)

    # ✅ Return GPT output
    return {
        "spoken_message": parsed.get("spoken_message", raw_content),
        "system_design_question": parsed.get("system_design_question", ""),
    }



# ==== FOLLOW-UP Endpoint ====

@router.post("/interview/system-design")
async def handle_system_design_response(req: SystemDesignFollowupRequest):
    print("🧠 [System Design Follow-up]")

    # Get conversation history
    key = f"system_session:{req.session_id}"
    raw = redis_client.get(key)
    messages = json.loads(raw) if raw else [
        {"role": "system", "content": system_message}
    ]

    # Get interview metadata with current phase
    metadata_key = f"system_session_metadata:{req.session_id}"
    raw_metadata = redis_client.get(metadata_key)
    metadata = json.loads(raw_metadata) if raw_metadata else {
        "current_phase": 1,  # Default to Phase 1 if not found
        "question": "",
        "candidate_level": req.candidate_level,
        "job_role": req.job_role
    }
    
    current_phase = metadata.get("current_phase", 1)
    
    # Add user's spoken response
    messages.append({"role": "user", "content": req.spoken_response})
    
    # Add canvas data if available
    if req.canvas_data:
        messages.append({"role": "user", "content": f"Design canvas: {req.canvas_data}"})
    
    # Phase-specific guidance for the AI
    phase_guidance = {
        1: "The candidate is introducing themselves. After this, transition to PHASE 2 by clearly stating the system design question and inviting clarification questions.",
        2: "The candidate is asking clarification questions or responding to the question. If they seem ready to define requirements, guide them to PHASE 3.",
        3: "The candidate is defining functional/non-functional requirements. Review these and when complete, guide them to PHASE 4.",
        4: "The candidate is designing the system on the canvas. Ask about design choices and when they indicate completion, move to PHASE 5.",
        5: "The candidate has completed their design. Evaluate it focusing on latency, availability, maintainability, scalability, data consistency, and security."
    }
    
    # Add guidance based on current phase
    messages.append({
        "role": "user", 
        "content": f"Current interview phase: {current_phase}. {phase_guidance.get(current_phase, '')} Provide appropriate feedback or questions to guide the candidate. Keep your response under 500 characters."
    })

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            temperature=0.7,
            max_tokens=300,
        )
        feedback = response.choices[0].message.content.strip()

        if feedback in ('', '""', "''"):
            print("❌ Empty feedback received.")
            return {"response": ""}

        # Add AI response to conversation history
        messages.append({"role": "assistant", "content": feedback})
        redis_client.set(key, json.dumps(messages))
        redis_client.expire(key, 3600)
        
        # Determine if we should advance to the next phase based on content analysis
        should_advance = False
        
        # Simple phase transition detection - these would need refinement in production
        phase_transitions = {
            1: ["proceed", "question", "design task", "problem"],  # Intro → Question
            2: ["requirements", "functional", "non-functional", "define"],  # Question → Requirements
            3: ["design", "draw", "diagram", "canvas", "implement"],  # Requirements → Design
            4: ["evaluate", "review", "completed", "finished", "done"],  # Design → Evaluation
        }
        
        # Check if we should advance the phase
        if current_phase < 5:  # Don't advance beyond phase 5
            transition_terms = phase_transitions.get(current_phase, [])
            
            # Check response content for phase transition signals
            lower_response = req.spoken_response.lower()
            for term in transition_terms:
                if term.lower() in lower_response:
                    should_advance = True
                    break
            
            # Check AI feedback for phase transition signals
            lower_feedback = feedback.lower()
            for term in transition_terms:
                if term.lower() in lower_feedback:
                    should_advance = True
                    break
        
        # Update the phase if needed
        if should_advance:
            current_phase += 1
            metadata["current_phase"] = current_phase
            redis_client.set(metadata_key, json.dumps(metadata))
            redis_client.expire(metadata_key, 3600)
            print(f"🔄 Advanced to interview phase {current_phase}")

    except Exception as e:
        print("❌ Follow-up error:", str(e))
        raise HTTPException(status_code=500, detail="Failed to process system design response.")

    try:
        log_interaction(
            collection="system_design_sessions",
            user_uid=req.user_id,
            session_id=req.session_id,
            interaction_data={
                "timestamp": datetime.utcnow(),
                "event": "follow-up",
                "spoken_response": req.spoken_response,
                "ai_feedback": feedback,
                "canvas_data": req.canvas_data,
                "interview_type": req.interview_type,
                "focus_system": req.focus_system,
                "job_role": req.job_role,
                "candidate_level": req.candidate_level,
                "company": req.company,
                "location": req.location,
                "resume": req.resume,
                "style": req.style,
                "email": req.user_email,
                "current_phase": current_phase,
            }
        )
    except Exception as e:
        print("❌ Firestore Follow-up Logging Error:", str(e))

    return {
        "spoken_message": feedback,
        "feedback": feedback,
        "current_phase": current_phase,
    }