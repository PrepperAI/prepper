from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from openai import OpenAI
from dotenv import load_dotenv
import json
import os
from datetime import datetime
import fitz  # PyMuPDF
import requests

from services.firestore_client import firestore_client as db, log_interaction
from services.redis_client import redis_client

router = APIRouter()

class TechnicalInterviewRequest(BaseModel):
    session_id: str
    language: str
    code: str
    spoken_response: str
    interview_type: str
    job_role: str
    candidate_level: str
    difficulty: str
    focus_area: str
    company: str | None = None
    location: str | None = None
    resume: str
    user_id: str | None = None
    user_email: str | None = None

class TechnicalInterviewInitRequest(BaseModel):
    session_id: str
    interview_type: str
    job_role: str
    candidate_level: str
    difficulty: str
    focus_area: str
    company: str | None = None
    location: str | None = None
    resume: str
    user_id: str | None = None
    user_email: str | None = None

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

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



# def get_technical_interview_prompt(req):
#     """Generate a personalized system prompt based on candidate attributes"""
#     return f"""
# You are playing the role of a real technical interviewer for a coding interview.

# Candidate Information:
# - Position: {req.job_role}
# - Experience Level: {req.candidate_level}
# - Difficulty Level: {req.difficulty}
# - Focus Area: {req.focus_area}
# - Company: {req.company or "Not specified"}


# Focus on technical interview topics and engineering problem solving.
# If the candidate's input is:
# - Completely off-topic/inappropriate - only then return an empty string "" and nothing else
# - Clearly relevant to the coding problem or software engineering - respond normally
# - Ambiguous but possibly relevant - interpret it charitably and respond with a clarifying technical question

# Respond to all reasonable technical questions, even if somewhat unclear or indirect. Guide the conversation back to technical aspects rather than ignoring ambiguous inputs.

# CRITICAL: ALL responses must be 500 characters or less. Never exceed this limit.
# Stay terse, technical, and realistic. Be concise but precise with your feedback.

# Always respond in JSON format like this:
# {{
#   "spoken_message": "<what you will say aloud - MUST be <= 500 characters>"
# }}

# INTERVIEW STRUCTURE - FOLLOW THIS EXACTLY:
# 0. BRIEF RESUME DIVE
#    - ask the candidate a few questions about their resume, 2 will be fine then go to phase 1
# 1. EXPLANATION PHASE: 
#    - The candidate MUST thoroughly explain their approach before writing ANY code
#    - Ask deep, probing questions about time complexity, space complexity, edge cases
#    - Only when you're satisfied with their explanation, explicitly tell them they can begin coding

# 2. CODING PHASE:
#    - Once the candidate has written code, thoroughly examine it
#    - Ask about specific parts of their implementation
#    - Challenge them on edge cases they might have missed
#    - Probe for optimizations or improvements

# 3. FOLLOW-UP PHASE:
#    - After discussing their code, ask about alternative approaches
#    - Discuss real-world implications, scalability concerns
#    - Ask detailed questions about how their solution would handle various edge cases

# Interviewer Guidance:
# - If the candidate's explanation is incomplete or lacks depth, probe further with follow-up questions to thoroughly assess their understanding.
# - Ask for clarification on ambiguous points, challenge assumptions, and explore edge cases.
# - When the candidate provides a thorough and accurate explanation, express satisfaction and acknowledgment of their good answer, and ONLY THEN permit them to begin coding.
# - For strong answers, respond with positive reinforcement like "That's a great explanation" or "I like your approach."
# - Balance critical assessment with constructive feedback.
# - IMPORTANT: You must determine when the candidate can move from the explanation phase to the coding phase. This is your decision based on the quality of their explanation.

# For relevant questions, your "spoken_message" should contain appropriate technical follow-up questions, guidance, or feedback.
# Tailor your questions and feedback to the candidate's experience level ({req.candidate_level}) and the requested difficulty ({req.difficulty}).

# Before responding, count the characters in your "spoken_message" and ensure it is 500 or fewer characters.
# """



# def get_technical_init_prompt(req, parsed_resume: str):
#     """Generate a personalized init prompt based on candidate attributes"""
#     return f"""
# You are playing the role of a real technical interviewer for a coding interview.

# Candidate Information:
# - Position: {req.job_role}
# - Experience Level: {req.candidate_level}
# - Difficulty Level: {req.difficulty}
# - Focus Area: {req.focus_area}
# - Company: {req.company or "Not specified"}
# Resume:
# {parsed_resume}

# CRITICAL: Your "spoken_message" must be 500 characters or less. Never exceed this limit.
# Stay terse, technical, and realistic. Be concise but precise with your feedback.

# For this {req.candidate_level}-level {req.job_role} position, create an appropriately challenging technical problem.
# The difficulty level should be "{req.difficulty}" and focus on the area of "{req.focus_area if req.focus_area else 'general programming'}".

# When generating a question, respond in JSON format like this:
# {{
#   "spoken_message": "<what you will say aloud - MUST be <= 500 characters>",
#   "code_prompt": "<The problem in comments. Use this structure:\\n\\n# Problem: <Title>\\n# Description:\\n# <problem description>\\n\\n# ---\\n# Explanation:\\n# Write your explanation here\\n\\n# ---\\n# Code:\\n# Define classes or function headers only here without implementing them.>"
# }}

# IMPORTANT INTERVIEW STRUCTURE:
# Make it clear to the candidate that they must first explain their approach before writing any code.
# Say something like: 'Please explain your approach to solving this problem. Only after you've explained your algorithm and we've discussed it, should you begin coding. Go ahead and walk me through your thought process first.'

# Make sure your spoken_message emphasizes the need for the candidate to explain their approach thoroughly first, before coding.
# Before responding, count the characters in your "spoken_message" and ensure it is 500 or fewer characters.
# """
def get_technical_interview_prompt(req):
    """Generate a personalized system prompt based on candidate attributes"""
    return f"""
You are acting as a real technical interviewer named Eric, a Senior Software Engineer at {req.company or "a top company"}.

Candidate Information:
- Position: {req.job_role}
- Experience Level: {req.candidate_level}
- Difficulty Level: {req.difficulty}
- Focus Area: {req.focus_area}
- Company: {req.company or "Not specified"}

You are NOT a tutor, assistant, or explainer. You are a professional interviewer whose job is to assess the candidate's thinking and skills.

Your goal is to:
- Elicit the best solution from the candidate, not give it to them
- Never explain the solution yourself
- Ask probing questions that deepen the candidate’s thinking
- Guide them to clarify, justify, and reason through their ideas

Do NOT:
- Never ever tell them what to use or do just ask them
- Give hints that reveal the actual solution
- Walk the candidate through an approach
- Explain how the algorithm or code should work

Respond to candidate inputs as follows:
- If off-topic/inappropriate → respond with "" (empty string) and nothing else
- If clearly technical or semi-relevant → interpret charitably and respond with a technical follow-up or clarification
- Always steer the conversation back to the coding problem and engineering thinking

CRITICAL: ALL responses must be 500 characters or fewer. NEVER exceed this limit.
Stay terse, technical, and realistic. Be concise but precise with your feedback.

Format:
Always respond in JSON:
{{
  "spoken_message": "<what you will say aloud - MUST be <= 500 characters>"
}}

INTERVIEW STRUCTURE (Follow Exactly):

0. BRIEF RESUME DIVE:
   - Ask 2 questions based on their resume, then transition to the problem.

1. EXPLANATION PHASE:
   - Ask the candidate to explain their full approach first
   - Probe their understanding: time/space complexity, edge cases
   - Do not let them code until you're satisfied
   - Say: "You may begin coding" only after a solid explanation

2. CODING PHASE:
   - Review the candidate’s code critically
   - Ask questions about specific logic, performance, and test cases
   - Probe for missed cases or better approaches

3. FOLLOW-UP PHASE:
   - Ask for alternative solutions
   - Discuss trade-offs, scalability, and edge case coverage
   - Continue to assess thoughtfulness and technical rigor

GUIDANCE:
- Always think like a real interviewer
- Never solve problems for the candidate
- Use technical language appropriate to their level: {req.candidate_level}
- Adjust expectations based on difficulty: {req.difficulty}
- Stay focused, skeptical, and fair

Reminder: spoken_message must always be 500 characters or fewer.
"""


def get_technical_init_prompt(req, parsed_resume: str):
    """Generate a personalized init prompt based on candidate attributes"""
    return f"""
You are playing the role of a real technical interviewer named **Eric**, a Senior Software Engineer at {req.company or "a top tech company"}.

Candidate Information:
- Position: {req.job_role}
- Experience Level: {req.candidate_level}
- Difficulty Level: {req.difficulty}
- Focus Area: {req.focus_area}
- Company: {req.company or "Not specified"}
Resume:
{parsed_resume}

CRITICAL: Your "spoken_message" must be 500 characters or less. Never exceed this limit.
Stay terse, technical, and realistic. Be concise but precise with your tone and feedback.

For this {req.candidate_level}-level {req.job_role} position, create an appropriately challenging technical problem.
The difficulty level should be "{req.difficulty}" and focus on the area of "{req.focus_area if req.focus_area else 'general programming'}".

When generating a question, respond in hundred percent JSON format like this and nothing else:
{{
  "spoken_message": "<what you will say aloud - MUST be <= 500 characters>",
  "code_prompt": "<The problem in comments. Use this structure:\\n\\n# Problem: <Title>\\n# Description:\\n# <problem description>\\n\\n# ---\\n# Explanation:\\n# Write your explanation here\\n\\n# ---\\n# Code:\\n# Define classes or function headers only here without implementing them.>"
}}

IMPORTANT INTERVIEW FLOW:

1. You should first say:  
   "Hi, I’m Eric, a Senior Software Engineer here at {req.company or 'our company'}. I’ll be walking you through this interview."

2. Then prompt the candidate to introduce themselves:  
   "Before we dive in, could you briefly introduce yourself?"

3. After the candidate's intro, present the question using a `spoken_message` that:  
   - Clearly summarizes the task  
   - Stresses that the candidate **must first explain their approach** before writing code  
   - Reminds them you’ll discuss their plan before they begin coding

Example line:  
"Thanks for the intro. Here’s your challenge. But first, please walk me through your thought process before coding."

Before responding, count the characters in your `spoken_message` and ensure it is **500 or fewer**.
"""


@router.post("/interview/technical")
async def technical_interview(req: TechnicalInterviewRequest):
    session_id = req.session_id
    key = f"technical_session:{session_id}"

    raw = redis_client.get(key)
    messages = json.loads(raw) if raw else []

    # Generate personalized system prompt
    personalized_prompt = get_technical_interview_prompt(req)

    if not messages:
        # Make sure we're using the correct prompt for ongoing interviews
        messages = [{"role": "system", "content": personalized_prompt}]
    else:
        # Replace the system message to ensure we're using the right prompt
        # First check if the first message is a system message
        if messages[0]["role"] == "system":
            messages[0] = {"role": "system", "content": personalized_prompt}
        else:
            # Insert a system message at the beginning
            messages.insert(0, {"role": "system", "content": personalized_prompt})

    user_message = (
        f"""
Here is the candidate's {req.language} code:

{req.code if req.code.strip() else 'No code yet.'}

The candidate said (via transcription):
"{req.spoken_response}"
"""
    )

    messages.append({"role": "user", "content": user_message})

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=messages,
        temperature=0.3,
        max_tokens=1024
    )

    ai_reply = response.choices[0].message.content.strip()
    print("This is the AI reply:", ai_reply)
    
    # If response is empty, return empty feedback
    if ai_reply in ('', '""', "''"):
        return {"feedback": ""}
    
    messages.append({"role": "assistant", "content": ai_reply})
    redis_client.set(key, json.dumps(messages))
    redis_client.expire(key, 3600)

    # Parse JSON response properly
    try:
        # Attempt to parse as JSON
        ai_reply_json = json.loads(ai_reply)
        
        # Check if the JSON is empty or missing spoken_message
        if not ai_reply_json or not ai_reply_json.get("spoken_message"):
            print("⚠️ Empty JSON or missing spoken_message")
            return {"feedback": ""}
            
        spoken_message = ai_reply_json.get("spoken_message", "")
        
        # Log interaction with the parsed JSON response
        log_interaction(
            collection="technical_sessions",
            user_uid=req.user_id or "anonymous",
            session_id=session_id,
            interaction_data={
                "timestamp": datetime.utcnow(),
                "language": req.language,
                "code": req.code,
                "spoken_response": req.spoken_response,
                "ai_response": ai_reply,
                "spoken_message": spoken_message,
                "interview_type": req.interview_type,
                "job_role": req.job_role,
                "candidate_level": req.candidate_level,
                "difficulty": req.difficulty,
                "focus_area": req.focus_area,
                "company": req.company,
                "location": req.location,
                "resume": req.resume,
                "email": req.user_email or "unknown@example.com",
            }
        )
        
        return {"feedback": spoken_message}
        
    except json.JSONDecodeError:
        # If not valid JSON, it might be plaintext or empty
        print("❌ JSON parsing failed, using raw response")
        
        # If not JSON and the response is very short or empty, treat as empty
        if len(ai_reply) < 3:
            return {"feedback": ""}
        
        try:
            log_interaction(
                collection="technical_sessions",
                user_uid=req.user_id or "anonymous",
                session_id=session_id,
                interaction_data={
                    "timestamp": datetime.utcnow(),
                    "language": req.language,
                    "code": req.code,
                    "spoken_response": req.spoken_response,
                    "ai_response": ai_reply,
                    "interview_type": req.interview_type,
                    "job_role": req.job_role,
                    "candidate_level": req.candidate_level,
                    "difficulty": req.difficulty,
                    "focus_area": req.focus_area,
                    "company": req.company,
                    "location": req.location,
                    "resume": req.resume,
                    "email": req.user_email or "unknown@example.com",
                }
            )
        except Exception as e:
            print("❌ Firestore log (technical) failed:", e)
            
        return {"feedback": ai_reply}

@router.post("/interview/technical/init")
async def initialize_technical_interview(req: TechnicalInterviewInitRequest):
    print("Here is your resume URL:", req.resume)
    session_id = req.session_id
    key = f"technical_session:{session_id}"
    print(f"📧 Email: {req.user_email} | 🔑 UID: {req.user_id}")

    try:
        user_ref = db.collection("users").document(req.user_id)
        user_doc = user_ref.get()
        if not user_doc.exists:
            raise HTTPException(status_code=404, detail="User not found")

        user_data = user_doc.to_dict()
        if not user_data.get("isPremium", False):
            attempts = user_data.get("remainingAttempts", {}).get("technical", 0)
            if attempts <= 0:
                raise HTTPException(status_code=403, detail="No remaining Technical interview attempts.")
            user_ref.update({"remainingAttempts.technical": attempts - 1})
            print(f"🟠 Technical attempt decremented: {attempts - 1}")
    except Exception as e:
        print(f"❌ Attempt decrement failed: {e}")
        raise HTTPException(status_code=500, detail="Error checking technical attempts")

    # Generate personalized init prompt
    parsed_resume = extract_text_from_pdf_url(req.resume)
    personalized_init_prompt = get_technical_init_prompt(req, parsed_resume)

    user_prompt = (
        "Please begin the interview. Respond ONLY in this JSON format:\n\n"
        "{\n"
        "  \"spoken_message\": \"<what you will say aloud>\",\n"
        "  \"code_prompt\": \"<structured code prompt as defined in the system message>\"\n"
        "}\n\n"
        "Do not explain or add anything outside this JSON object."
    )

    messages = [
        {"role": "system", "content": personalized_init_prompt},
        {"role": "user", "content": user_prompt}
    ]

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=messages,
        temperature=0.5,
        max_tokens=1024
    )

    ai_message = response.choices[0].message.content

    # Store the messages but with the ongoing interview prompt for future interactions
    redis_client.set(key, json.dumps([
        {"role": "system", "content": get_technical_interview_prompt(req)},
        {"role": "assistant", "content": ai_message}
    ]))
    redis_client.expire(key, 3600)

    try:
        json_reply = json.loads(ai_message)
        spoken = json_reply.get("spoken_message", "")
        code = json_reply.get("code_prompt", "")
    except json.JSONDecodeError:
        spoken = ai_message
        code = "# Could not extract code prompt. Please refresh or try again."

    try:
        session_doc_ref = db.collection("technical_sessions") \
            .document(req.user_id or "anonymous") \
            .collection("sessions") \
            .document(session_id)

        session_doc_ref.set({
            "timestamp": datetime.utcnow(),
            "event": "init",
            "job_role": req.job_role,
            "candidate_level": req.candidate_level,
            "difficulty": req.difficulty,
            "focus_area": req.focus_area,
            "company": req.company,
            "location": req.location,
            "resume": req.resume,
            "email": req.user_email or "unknown@example.com",
        })

        log_interaction(
            collection="technical_sessions",
            user_uid=req.user_id or "anonymous",
            session_id=session_id,
            interaction_data={
                "timestamp": datetime.utcnow(),
                "event": "init",
                "spoken_message": spoken,
                "code_prompt": code,
                "job_role": req.job_role,
                "candidate_level": req.candidate_level,
                "difficulty": req.difficulty,
                "focus_area": req.focus_area,
                "company": req.company,
                "location": req.location,
                "resume": req.resume,
                "email": req.user_email or "unknown@example.com",
            }
        )
    except Exception as e:
        print("❌ Firestore log (technical init) failed:", e)

    return {
        "spoken_message": spoken,
        "code_prompt": code
    }
