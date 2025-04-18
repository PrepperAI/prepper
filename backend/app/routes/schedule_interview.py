from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from services.firestore_client import firestore_client as db
import uuid

router = APIRouter()

# ==== Request Model ====

class ScheduleRequest(BaseModel):
    user_id: str
    session_id: Optional[str] = None  # Allow frontend to send or let backend generate
    type: str                        # "behavioral", "technical", or "system_design"
    role: Optional[str] = None
    level: Optional[str] = None
    date: str                        # e.g., "2025-04-18"
    time: str                        # e.g., "14:30"
    timezone: Optional[str] = "UTC"

class RescheduleRequest(BaseModel):
    date: str
    time: str


# ==== Endpoint ====

@router.post("/schedule")
async def schedule_interview(req: ScheduleRequest):
    session_id = req.session_id or str(uuid.uuid4())

    try:
        doc_ref = db.collection("scheduled_interviews") \
                    .document(req.user_id) \
                    .collection("sessions") \
                    .document(session_id)

        doc_ref.set({
            "session_id": session_id,
            "type": req.type,
            "role": req.role,
            "level": req.level,
            "date": req.date,
            "time": req.time,
            "timezone": req.timezone,
            "created_at": datetime.utcnow(),
        })

        return {"status": "scheduled", "session_id": session_id}

    except Exception as e:
        print("❌ Firestore Schedule Error:", str(e))
        raise HTTPException(status_code=500, detail="Failed to schedule interview.")


@router.get("/schedule/list")
async def get_user_schedules(user_id: str):
    try:
        docs = db.collection("scheduled_interviews").document(user_id).collection("sessions").stream()
        sessions = [doc.to_dict() for doc in docs]
        return {"sessions": sessions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

@router.delete("/schedule/{user_id}/{session_id}")
async def cancel_schedule(user_id: str, session_id: str):
    try:
        doc_ref = db.collection("scheduled_interviews").document(user_id).collection("sessions").document(session_id)
        doc_ref.delete()
        return {"status": "cancelled"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class RescheduleRequest(BaseModel):
    date: str
    time: str

@router.patch("/schedule/{user_id}/{session_id}")
async def reschedule_interview(user_id: str, session_id: str, req: RescheduleRequest):
    try:
        doc_ref = db.collection("scheduled_interviews") \
                    .document(user_id) \
                    .collection("sessions") \
                    .document(session_id)

        doc = doc_ref.get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Session not found")

        doc_ref.update({
            "date": req.date,
            "time": req.time,
        })

        return {"status": "rescheduled"}

    except Exception as e:
        print("❌ Firestore Reschedule Error:", str(e))
        raise HTTPException(status_code=500, detail="Failed to reschedule interview.")
