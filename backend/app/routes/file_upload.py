from fastapi import APIRouter, UploadFile, File
from fastapi.responses import FileResponse
import shutil
import subprocess
import uuid

router = APIRouter()

@router.post("/upload-presentation")
async def upload_presentation(file: UploadFile = File(...)):
    ext = file.filename.split(".")[-1].lower()
    uid = uuid.uuid4().hex
    input_path = f"/tmp/{uid}.{ext}"
    output_path = f"/tmp/{uid}.pdf"

    # Save uploaded file
    with open(input_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    if ext == "pdf":
        return FileResponse(input_path, media_type="application/pdf")

    # Convert PPT/PPTX to PDF using LibreOffice
    subprocess.run([
    "/Applications/LibreOffice.app/Contents/MacOS/soffice",
    "--headless", "--convert-to", "pdf", "--outdir", "/tmp", input_path
], check=True)

    return FileResponse(output_path, media_type="application/pdf")
