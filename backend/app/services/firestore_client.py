# utils/firestore_client.py

import os
from dotenv import load_dotenv
from google.cloud import firestore
from google.oauth2 import service_account

load_dotenv()

# Load the path from .env
SERVICE_ACCOUNT_PATH = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")

if not SERVICE_ACCOUNT_PATH:
    raise ValueError("❌ GOOGLE_APPLICATION_CREDENTIALS not set in .env")

# Setup credentials and Firestore client
credentials = service_account.Credentials.from_service_account_file(SERVICE_ACCOUNT_PATH)
firestore_client = firestore.Client(credentials=credentials)

# ✅ Optional helper: Log an interaction
def log_interaction(collection, user_uid, session_id, interaction_data):
    try:
        session_ref = (
            firestore_client.collection(collection)
            .document(user_uid)
            .collection("sessions")
            .document(session_id)
            .collection("interactions")
        )
        session_ref.add(interaction_data)
        print(f"✅ Logged to Firestore: {collection}/{user_uid}/{session_id}")
    except Exception as e:
        print("❌ Firestore logging error:", str(e))
