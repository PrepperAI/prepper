from fastapi import APIRouter, UploadFile, File
import azure.cognitiveservices.speech as speechsdk
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

router = APIRouter()

# Azure Speech API Config
SPEECH_KEY = os.getenv("AZURE_SPEECH_KEY")
SPEECH_REGION = os.getenv("AZURE_SPEECH_REGION")

def transcribe_audio(audio_path: str):
    """Transcribes an audio file using Azure Speech-to-Text"""
    speech_config = speechsdk.SpeechConfig(subscription=SPEECH_KEY, region=SPEECH_REGION)
    speech_config.speech_recognition_language="en-US"
    audio_config = speechsdk.audio.AudioConfig(use_default_microphone=False, filename=audio_path)


    recognizer = speechsdk.SpeechRecognizer(speech_config=speech_config, audio_config=audio_config)

    result = recognizer.recognize_once()

    if result.reason == speechsdk.ResultReason.RecognizedSpeech:
        return result.text
    else:
        return "Could not transcribe audio"

@router.post("/transcribe")
async def transcribe_audio_endpoint(file: UploadFile = File(...)):
    """FastAPI endpoint to receive audio and transcribe it"""
    file_path = f"temp_{file.filename}"
    
    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())

    transcription = transcribe_audio(file_path)

    return {"transcription": transcription}


