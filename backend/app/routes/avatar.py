from fastapi import APIRouter, HTTPException,  Request
import requests
from pydantic import BaseModel
import os
from dotenv import load_dotenv
from fastapi.responses import JSONResponse

load_dotenv()
router = APIRouter()

class AnswerRequest(BaseModel):
    stream_id: str  # ✅ Add this
    session_id: str
    sdp: str

class IceCandidate(BaseModel):
    candidate: str
    sdpMid: str
    sdpMLineIndex: int
    session_id: str
    stream_id: str

class SpeakRequest(BaseModel):
    stream_id: str
    session_id: str
    text: str

class KeepAliveRequest(BaseModel):
    stream_id: str
    session_id: str

DID_API_KEY = os.getenv("DID_API_KEY")
DID_API_URL = os.getenv("DID_URL")  


DID_API_KEY = os.getenv("DID_API_KEY")
DID_API_URL = os.getenv("DID_URL") or "https://api.d-id.com"

@router.post("/avatar/start-session")
async def start_avatar_session():
    headers = {
        "Authorization": f"Basic {DID_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "source_url": "https://images.squarespace-cdn.com/content/v1/55550428e4b0d770e3f981ab/1571239285450-GTIQPEKRJB3NPFY81DHG/Happy-Hour-Headshot-36143.JPG"
    }
    try:
        response = requests.post(f"{DID_API_URL}/talks/streams", json=payload, headers=headers)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Failed to start avatar session: {str(e)}")

@router.post("/avatar/send-answer")
async def send_avatar_answer(answer: AnswerRequest):
    headers = {
        "Authorization": f"Basic {DID_API_KEY}",
        "Content-Type": "application/json",
    }
    try:
        payload = {
            "answer": {
                "type": "answer",            # ✅ required
                "sdp": answer.sdp            # ✅ the actual SDP string
            },
            "session_id": answer.session_id  # ✅ required
        }

        response = requests.post(
            f"{DID_API_URL}/talks/streams/{answer.stream_id}/sdp",
            json=payload,
            headers=headers
        )

        response.raise_for_status()
        return {"status": "ok"}

    except requests.exceptions.RequestException as e:
        print("❌ Error sending answer to D-ID:", str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Error sending answer to D-ID: {str(e)}"
        )


@router.post("/avatar/send-ice")
async def send_ice_candidate(ice: IceCandidate):
    headers = {
        "Authorization": f"Basic {DID_API_KEY}",
        "Content-Type": "application/json",
    }

    payload = {
        "candidate": ice.candidate,
        "sdpMid": ice.sdpMid,
        "sdpMLineIndex": ice.sdpMLineIndex,
        "session_id": ice.session_id
    }

    try:
        response = requests.post(
            f"{DID_API_URL}/talks/streams/{ice.stream_id}/ice",
            json=payload,
            headers=headers,
        )
        response.raise_for_status()
        return {"status": "ok"}
    except requests.exceptions.RequestException as e:
        print("❌ Error sending ICE to D-ID:", str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Error sending ICE candidate: {str(e)}"
        )



@router.post("/avatar/send-answer")
async def send_avatar_answer(answer: AnswerRequest):
    headers = {
        "Authorization": f"Basic {DID_API_KEY}",
        "Content-Type": "application/json",
    }

    try:
        response = requests.post(
            f"{DID_API_URL}/talks/streams/{answer.stream_id}/sdp",
            json={
                "answer": answer.sdp,
                "session_id": answer.session_id,
            },
            headers=headers,
        )
        response.raise_for_status()
        return {"status": "ok"}

    except requests.exceptions.RequestException as e:
        print("❌ Error sending answer to D-ID:", str(e))
        raise HTTPException(
            status_code=500, detail=f"Error sending answer to D-ID: {str(e)}"
        )

@router.post("/avatar/speak")
async def speak_avatar(req: SpeakRequest):
    print('I am in speak_avatar')
    headers = {
        "Authorization": f"Basic {DID_API_KEY}",
        "Content-Type": "application/json",
    }
    body = {
        "script": {
            "type": "text",
            "input": req.text,
            "provider": {
                "type": "microsoft",
                "voice_id": "en-US-JennyNeural"
            },
        },
        "config": {"stitch": True},
        "session_id": req.session_id,
    }

    try:
        response = requests.post(
            f"{DID_API_URL}/talks/streams/{req.stream_id}",
            json=body,
            headers=headers
        )
        print("🔁 /avatar/speak payload:", body)
        print("🔁 D-ID response:", response.status_code, response.text)
        response.raise_for_status()
        return {"status": "ok"}
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Failed to send speech: {str(e)}")


@router.post("/avatar/keep-alive")
async def keep_avatar_alive(req: KeepAliveRequest):
    try:
        response = requests.post(
            f"{DID_API_URL}/talks/streams/{req.stream_id}",
            headers={
                "Authorization": f"Basic {DID_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "script": {
                    "type": "text",
                    "input": "<break time='2s'/>",
                    "provider": {
                        "type": "microsoft",
                        "voice_id": "en-US-JennyNeural"
                    },
                    "ssml": True
                },
                "config": {"stitch": True},
                "session_id": req.session_id
            }
        )
        response.raise_for_status()
        return {"status": "ok"}
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Keep-alive failed: {str(e)}")


# Add this endpoint to your FastAPI backend

@router.post("/api/avatar/status")
async def check_avatar_status(request: dict):
    """Check if the avatar is currently speaking or idle"""
    try:
        stream_id = request.get("stream_id")
        session_id = request.get("session_id")
        
        if not stream_id or not session_id:
            return JSONResponse(status_code=400, content={"error": "Missing stream_id or session_id"})
            
        # Check if there's an active talk session
        # This implementation depends on how you're tracking speech state on the backend
        # Option 1: Use D-ID API to check stream status
        headers = {"Authorization": f"Basic {DID_API_KEY}"}
        response = requests.get(
            f"{DID_API_URL}/talks/streams/{stream_id}",
            headers=headers
        )
        
        if response.status_code == 200:
            stream_data = response.json()
            # Extract status from stream data - adjust according to D-ID API response structure
            status = stream_data.get("status", "unknown")
            return {"status": status}
        
        # Option 2: If you're tracking speaking state in memory
        # (simplified example - actual implementation depends on your backend structure)
        # active_talks = get_active_talks()
        # is_active = any(talk["stream_id"] == stream_id and talk["session_id"] == session_id 
        #                 for talk in active_talks)
        # return {"status": "speaking" if is_active else "idle"}
        
        # Return idle if no info available
        return {"status": "idle"}
        
    except Exception as e:
        print(f"Error checking avatar status: {str(e)}")
        return JSONResponse(status_code=500, content={"error": str(e)})

