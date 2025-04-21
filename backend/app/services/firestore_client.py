# # utils/firestore_client.py

# import os
# from dotenv import load_dotenv
# from google.cloud import firestore
# from google.oauth2 import service_account

# load_dotenv()

# # Load the path from .env
# SERVICE_ACCOUNT_PATH = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")

# if not SERVICE_ACCOUNT_PATH:
#     raise ValueError("❌ GOOGLE_APPLICATION_CREDENTIALS not set in .env")

# # Setup credentials and Firestore client
# credentials = service_account.Credentials.from_service_account_file(SERVICE_ACCOUNT_PATH)
# firestore_client = firestore.Client(credentials=credentials)

# # ✅ Optional helper: Log an interaction
# def log_interaction(collection, user_uid, session_id, interaction_data):
#     try:
#         session_ref = (
#             firestore_client.collection(collection)
#             .document(user_uid)
#             .collection("sessions")
#             .document(session_id)
#             .collection("interactions")
#         )
#         session_ref.add(interaction_data)
#         print(f"✅ Logged to Firestore: {collection}/{user_uid}/{session_id}")
#     except Exception as e:
#         print("❌ Firestore logging error:", str(e))
import os
import json
from dotenv import load_dotenv
from google.cloud import firestore
from google.oauth2 import service_account

load_dotenv()

# Use env variable content on Render, fallback to local file for dev
FIREBASE_CREDENTIALS_JSON = os.getenv("FIREBASE_CREDENTIALS_JSON")
GOOGLE_CREDENTIALS_PATH = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")

if FIREBASE_CREDENTIALS_JSON:
    print("🔐 Loading Firebase credentials from env (Render)")
    creds_dict = json.loads(FIREBASE_CREDENTIALS_JSON)
    credentials = service_account.Credentials.from_service_account_info(creds_dict)
elif GOOGLE_CREDENTIALS_PATH and os.path.exists(GOOGLE_CREDENTIALS_PATH):
    print("🧪 Loading Firebase credentials from local file")
    credentials = service_account.Credentials.from_service_account_file(GOOGLE_CREDENTIALS_PATH)
else:
    raise RuntimeError("❌ Firebase credentials not found (env or file)")

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
