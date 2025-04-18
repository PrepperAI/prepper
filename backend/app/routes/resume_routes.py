from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import openai
import os

router = APIRouter()
client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

class SuggestionRequest(BaseModel):
    bullet: str
    job_description: str | None = None
    experience_level: str | None = "mid"
    industry: str | None = "tech"

@router.post("/resume/suggest")
async def suggest_resume_improvement(req: SuggestionRequest):
    job_context = ""
    if req.job_description:
        job_context = f"Here is the job description to tailor the bullet point for:\n{req.job_description}"

    prompt = f"""
You are a resume writing assistant for job seekers in the {req.industry} industry at the {req.experience_level} level.

Given this bullet point:
"{req.bullet}"

{job_context}

Generate 3 improved versions of this bullet point that are more effective, tailored, and achievement-oriented. Keep them concise and professional. Return as a JSON list.
""".strip()

    try:
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful and concise resume writing assistant."
                },
                {
                    "role": "user",
                    "content": prompt
                },
            ],
            temperature=0.7,
            max_tokens=300,
        )

        import json
        content = response.choices[0].message.content.strip()
        suggestions = json.loads(content)

        return { "suggestions": suggestions }

    except Exception as e:
        print("❌ Error generating suggestions:", str(e))
        raise HTTPException(status_code=500, detail="Failed to generate suggestions.")
