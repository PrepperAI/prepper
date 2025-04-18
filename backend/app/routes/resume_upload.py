from fastapi import APIRouter, HTTPException, UploadFile, File, Request
from google.cloud import storage
from urllib.parse import quote
import os

router = APIRouter()
storage_client = storage.Client()
BUCKET_NAME = "course-craze.firebasestorage.app"

@router.post("/upload-resume")
async def upload_resume(file: UploadFile = File(...), request: Request = None):
    user_id = request.query_params.get("user_id")
    if not user_id:
        raise HTTPException(status_code=400, detail="Missing user_id parameter")
    
    try:
        file_content = await file.read()
        filename = file.filename
        blob_path = f"resumes/{user_id}/{filename}"

        bucket = storage_client.bucket(BUCKET_NAME)
        blob = bucket.blob(blob_path)
        blob.upload_from_string(file_content, content_type="application/pdf")

        # ✅ Make it public
        blob.make_public()

        # ✅ Correct public URL
        public_url = f"https://storage.googleapis.com/{BUCKET_NAME}/{blob_path}"

        return {"url": public_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
