from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.firestore_client import firestore_client as db
from openai import OpenAI
import os
from dotenv import load_dotenv
from datetime import datetime
import json

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
router = APIRouter()

class FeedbackRequest(BaseModel):
    user_id: str
    session_id: str
    interview_type: str = "behavioral"
    job_role: str | None = None
    level: str | None = None
    style: str | None = None



@router.post("/feedback/behavioral")
async def generate_behavioral_feedback(req: FeedbackRequest):
    try:
        # Step 1: Fetch all interactions
        coll_ref = (
            db.collection("behavioral_sessions")
            .document(req.user_id)
            .collection("sessions")
            .document(req.session_id)
            .collection("interactions")
        )
        docs = coll_ref.order_by("timestamp").stream()
        turns = [doc.to_dict() for doc in docs]

        # Step 2: Clean and format for GPT
        transcript = []
        for t in turns:
            user_msg = t.get("user_input", "").strip()
            ai_msg = t.get("ai_response", "").strip()
            if user_msg:
                transcript.append(f"🧑 Candidate: {user_msg}")
            if ai_msg:
                transcript.append(f"🤖 Interviewer: {ai_msg}")

        if not transcript:
            raise HTTPException(status_code=400, detail="Not enough data to generate feedback.")

        full_transcript = "\n".join(transcript)

        # Step 3: GPT Prompt
        SYSTEM_PROMPT = f"""
You are a behavioral interview coach analyzing a mock interview for a candidate applying to a {req.job_role or 'software engineering'} role at the {req.level or 'new grad'} level.

You will receive the full transcript of a behavioral interview (including questions, candidate responses, and AI follow-ups).

Your task is to analyze the interview and return structured feedback in JSON format, using the following schema:

{{
  "summary": "<Short summary of the candidate's overall performance in 3–4 sentences>",
  "strengths": ["Point 1", "Point 2", "Point 3"],
  "improvements": ["Point 1", "Point 2", "Point 3"],
  "resources": [
    {{
      "title": "Resource Title 1",
      "url": "https://example.com/resource1"
    }},
    {{
      "title": "Resource Title 2",
      "url": "https://example.com/resource2"
    }},
    {{
      "title": "Resource Title 3",
      "url": "https://example.com/resource3"
    }}
  ]
}}

Guidelines:
- Be concise and honest, but supportive.
- Each section should include 2–3 specific, helpful bullet points.
- Use only valid, real resource links (no placeholders).
- Respond with only the JSON object — no prose, markdown, or extra text.
"""

        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": full_transcript},
            ],
            temperature=0.7,
            max_tokens=700,
        )

        raw_output = response.choices[0].message.content

        # Step 4: Validate and parse GPT output
        try:
            feedback = json.loads(raw_output)

            # Validate structure
            assert isinstance(feedback, dict)
            assert "summary" in feedback
            assert isinstance(feedback.get("strengths"), list)
            assert isinstance(feedback.get("improvements"), list)
            assert isinstance(feedback.get("resources"), list)
            for res in feedback["resources"]:
                assert "title" in res and "url" in res

        except (json.JSONDecodeError, AssertionError) as e:
            print("❌ Invalid GPT output:\n", raw_output)
            raise HTTPException(status_code=500, detail="GPT did not return valid structured JSON.")

        # Step 5: Save to Firestore
        session_ref = (
            db.collection("behavioral_sessions")
            .document(req.user_id)
            .collection("sessions")
            .document(req.session_id)
        )

        session_ref.update({
            "feedback": feedback,
            "feedback_generated_at": datetime.utcnow()
        })

        return {"feedback": feedback}

    except Exception as e:
        print("❌ Feedback Error:", e)
        raise HTTPException(status_code=500, detail="Failed to generate feedback.")


@router.post("/feedback/technical")
async def generate_technical_feedback(req: FeedbackRequest):
    try:
        # Step 1: Fetch all interactions for session
        coll_ref = (
            db.collection("technical_sessions")
            .document(req.user_id)
            .collection("sessions")
            .document(req.session_id)
            .collection("interactions")
        )
        docs = coll_ref.order_by("timestamp").stream()
        turns = [doc.to_dict() for doc in docs]

        # Step 2: Get init prompt
        init_doc = next((t for t in turns if t.get("event") == "init"), None)
        code_prompt = init_doc.get("code_prompt", "N/A") if init_doc else "N/A"

        # Step 3: Build transcript
        transcript = [f"[🧠 Technical Question]\n{code_prompt}\n"]
        for t in turns:
            if t.get("event") == "init":
                continue

            user = t.get("spoken_response", "").strip()
            ai_raw = t.get("ai_response", "").strip()

            try:
                ai_dict = json.loads(ai_raw) if ai_raw else {}
                ai = ai_dict.get("spoken_message", "").strip()
            except Exception:
                ai = ai_raw

            if user:
                transcript.append(f"🧑 Candidate: {user}")
            if ai:
                transcript.append(f"🤖 Interviewer: {ai}")

        if len(transcript) < 2:
            raise HTTPException(status_code=400, detail="Not enough data to generate feedback.")

        full_transcript = "\n".join(transcript)

        # Step 4: GPT Prompt
        SYSTEM_PROMPT = f"""
You are a behavioral interview coach analyzing a mock interview for a candidate applying to a {req.job_role or 'software engineering'} role at the {req.level or 'new grad'} level.

You will receive the full transcript of a behavioral interview, including questions, candidate responses, and AI follow-ups.

Your task is to analyze the interview and return structured feedback in JSON format using this schema:

{{
  "summary": "<Short summary of the candidate's overall performance in 3–4 sentences>",
  "strengths": ["Point 1", "Point 2", "Point 3"],
  "improvements": ["Point 1", "Point 2", "Point 3"],
  "resources": [
    {{
      "title": "Relevant Resource Title",
      "url": "https://..."
    }},
{{
      "title": "Resource Title 2",
      "url": "https://example.com/resource2"
    }},
 {{
      "title": "Resource Title 3",
      "url": "https://example.com/resource3"
    }} ,   
...
  ]
}}

Guidelines:
- Be concise, honest, and supportive.
- Each section should include 2–3 actionable, specific bullet points.
- The 'resources' section must include 2–3 useful, real-world links (articles, videos, guides, etc.) directly related to the candidate’s improvement areas.
- Choose different resources each time based on the candidate’s actual weaknesses (e.g. if they lacked STAR structure, recommend a guide on that).
- Avoid placeholder links or repeating generic examples.
- Only return valid JSON — no markdown, no commentary, no extra prose.
"""



        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": full_transcript}
            ],
            temperature=0.7,
            max_tokens=700
        )

        raw_output = response.choices[0].message.content

        # Step 5: Parse + validate JSON
        try:
            feedback = json.loads(raw_output)
            assert "summary" in feedback
            assert isinstance(feedback.get("strengths"), list)
            assert isinstance(feedback.get("improvements"), list)
            assert isinstance(feedback.get("resources"), list)
        except Exception as e:
            print("❌ GPT Invalid Output:\n", raw_output)
            raise HTTPException(status_code=500, detail="Invalid JSON returned by GPT.")

        # Step 6: Save to Firestore
        session_ref = (
            db.collection("technical_sessions")
            .document(req.user_id)
            .collection("sessions")
            .document(req.session_id)
        )
        session_ref.update({
            "feedback": feedback,
            "feedback_generated_at": datetime.utcnow()
        })

        return {"feedback": feedback}

    except Exception as e:
        print("❌ Feedback Error:", e)
        raise HTTPException(status_code=500, detail="Failed to generate technical feedback.")

@router.post("/feedback/system-design")
async def generate_system_design_feedback(req: FeedbackRequest):
    try:
        # Step 1: Get all interactions
        coll_ref = (
            db.collection("system_design_sessions")
            .document(req.user_id)
            .collection("sessions")
            .document(req.session_id)
            .collection("interactions")
        )
        docs = coll_ref.order_by("timestamp").stream()
        turns = [doc.to_dict() for doc in docs]

        # Step 2: Extract design question from the 'init' doc
        init_doc = next((t for t in turns if t.get("event") == "init"), None)
        design_question = init_doc.get("system_design_question", "N/A") if init_doc else "N/A"

        # Step 3: Extract most recent canvas data (if any)
        latest_canvas = None
        for t in reversed(turns):
            if isinstance(t.get("canvas_data"), list) and t["canvas_data"]:
                latest_canvas = t["canvas_data"]
                break

        # Step 4: Build transcript
        transcript_parts = [f"[🧠 System Design Question]\n{design_question}\n"]

        for t in turns:
            if t.get("event") == "init":
                continue
            user_msg = t.get("spoken_response", "").strip()
            ai_msg = t.get("ai_feedback", "").strip()
            if user_msg:
                transcript_parts.append(f"🧑 Candidate: {user_msg}")
            if ai_msg:
                transcript_parts.append(f"🤖 Interviewer: {ai_msg}")

        full_transcript = "\n".join(transcript_parts)

        # Step 5: Build GPT system prompt
        SYSTEM_PROMPT = f"""
You are a system design interview coach analyzing a mock interview for a candidate applying to a {req.job_role or 'Backend Engineer'} role ({req.level or 'Mid Level'} level).

You will receive:
1. A transcript of the interview
2. The full raw canvas data (in Excalidraw format) representing their final system diagram

Your task is to return structured feedback in JSON format. Focus on how well the candidate scoped the problem, included relevant components, explained tradeoffs, and used the diagram effectively.

Format your output exactly like this:

{{
  "summary": "<3–4 sentence performance summary>",
  "strengths": ["Point 1", "Point 2", "Point 3"],
  "improvements": ["Point 1", "Point 2", "Point 3"],
  "resources": [
    {{
      "title": "Relevant Resource Title",
      "url": "https://..."
    }},
    ...
  ]
}}

Guidelines:
- The 'resources' section must include 2–3 real, helpful resources (articles, videos, tutorials, GitHub repos, etc.) that are specifically relevant to the candidate’s improvement areas.
- Tailor these resources to the weaknesses observed in the candidate's performance.
- Do NOT reuse the same generic links every time.
- Use only valid URLs — no placeholders or fake links.
- Return **only** the JSON — no markdown, no extra explanation.
"""

        # Step 6: Compose user message with transcript and canvas
        canvas_json = json.dumps(latest_canvas or [])

        user_message = f"""
[📜 Interview Transcript]
{full_transcript}

[🧱 Canvas Data (raw Excalidraw JSON)]
{canvas_json}
"""

        # Step 7: Call GPT
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_message},
            ],
            temperature=0.7,
            max_tokens=1000,
        )

        raw_output = response.choices[0].message.content

        # Step 8: Validate JSON structure
        try:
            feedback = json.loads(raw_output)
            assert "summary" in feedback
            assert isinstance(feedback.get("strengths"), list)
            assert isinstance(feedback.get("improvements"), list)
            assert isinstance(feedback.get("resources"), list)
        except Exception as e:
            print("❌ GPT JSON Error:", raw_output)
            raise HTTPException(status_code=500, detail="Invalid JSON returned by GPT.")

        # Step 9: Save to Firestore
        session_ref = (
            db.collection("system_design_sessions")
            .document(req.user_id)
            .collection("sessions")
            .document(req.session_id)
        )
        session_ref.update({
            "feedback": feedback,
            "feedback_generated_at": datetime.utcnow()
        })

        return {"feedback": feedback}

    except Exception as e:
        print("❌ System Design Feedback Error:", e)
        raise HTTPException(status_code=500, detail="Failed to generate system design feedback.")
