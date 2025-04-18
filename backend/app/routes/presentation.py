from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import random
import os
import openai
import re
from datetime import datetime
from services.firestore_client import log_interaction


router = APIRouter()

# Initialize OpenAI client (v1+ syntax)
client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

class PresentationRequest(BaseModel):
    user_uid: str
    user_email: str
    transcript: str
    slideImage: str = None
    currentPage: int

@router.post("/presentation/respond")
async def generate_audience_response(request: PresentationRequest):
    if not request.transcript:
        raise HTTPException(status_code=400, detail="Transcript is required.")

    prompt_text = (
        f"You are attending a live presentation. The presenter is currently on slide {request.currentPage}. "
        f"They just said: \"{request.transcript}\"\n\n"
        "Based on the slide and their words, generate a short, intelligent audience response — "
        "either a question or insightful comment. Make it sound like a curious peer, not a generic bot."
    )

    # Build initial GPT message
    messages = [
        {
            "role": "system",
            "content": "You are a curious audience member reacting intelligently to a live presentation."
        },
        {
            "role": "user",
            "content": [
                {"type": "text", "text": prompt_text}
            ]
        }
    ]

    # If slide image is provided, add it to the request
    if request.slideImage:
        try:
            base64_data = re.sub("^data:image/.+;base64,", "", request.slideImage)
            messages[1]["content"].append({
                "type": "image_url",
                "image_url": {
                    "url": f"data:image/png;base64,{base64_data}"
                }
            })
        except Exception as e:
            print("⚠️ Failed to parse image:", str(e))

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            max_tokens=200,
            temperature=0.7
        )

        message = response.choices[0].message.content.strip()
        avatar_name = random.choice(["Lina", "Raj", "Sam", "Julia"])

    except Exception as e:
        print("❌ OpenAI error:", str(e))
        raise HTTPException(status_code=500, detail="Failed to generate audience response.")
    # 🔥 Firestore Logging Block
    try:
        log_interaction(
            collection="presentation_sessions",
            user_uid=request.user_uid,
            session_id="presentation",  # You can generate UUID per session if needed
            interaction_data={
                "timestamp": datetime.utcnow(),
                "slide": request.currentPage,
                "transcript": request.transcript,
                "slide_included": bool(request.slideImage),
                "avatar": avatar_name,
                "ai_response": message,
                "email": request.user_email,
                "event": "audience-response"
            }
        )
    except Exception as e:
        print("❌ Firestore logging error:", str(e))
    return {
        "message": message,
        "avatarName": avatar_name
    }