import stripe
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from datetime import datetime
from services.firestore_client import firestore_client as db
from dotenv import load_dotenv
import os

load_dotenv()

router = APIRouter()

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")

class CheckoutSessionRequest(BaseModel):
    email: str

class CancelRequest(BaseModel):
    user_id: str

@router.post("/create-checkout-session")
async def create_checkout_session(req: CheckoutSessionRequest):
    try:
        print("📩 Incoming email:", req.email)
        price_id = os.getenv("STRIPE_PRICE_ID")
        print("💸 Using price ID:", price_id)
        
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            mode="subscription",
            line_items=[{
                "price": price_id,
                "quantity": 1,
            }],
            customer_email=req.email,
            success_url="http://localhost:3000/dashboard?payment=success",
            cancel_url="http://localhost:3000/dashboard?payment=cancelled",
        )

        print("✅ Stripe session created:", session.id)
        return {"sessionId": session.id}
    except Exception as e:
        print("❌ Stripe error:", e)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/webhook")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, STRIPE_WEBHOOK_SECRET
        )
    except stripe.error.SignatureVerificationError as e:
        print("❌ Invalid webhook signature")
        raise HTTPException(status_code=400, detail=f"Webhook signature error: {str(e)}")

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        email = session.get("customer_email")
        subscription_id = session.get("subscription")

        print(f"✅ Checkout complete for {email} | Subscription ID: {subscription_id}")

        if not email:
            print("⚠️ No email found in session.")
            return {"status": "skipped"}

        try:
            user_docs = db.collection("users").where("email", "==", email).limit(1).stream()
            matched = False
            for doc in user_docs:
                doc.reference.update({
                    "isPremium": True,
                    "planType": "premium",
                    "premium_activated_at": datetime.utcnow(),
                    "stripe_subscription_id": subscription_id,
                    "cancelled": False,
                    "cancelled_at": None
                })
                print(f"🔥 User {email} marked as premium with subscription {subscription_id}")
                matched = True

            if not matched:
                print(f"⚠️ No matching Firestore document for email: {email}")
        except Exception as e:
            print(f"❌ Firestore update failed: {e}")

    elif event["type"] == "customer.subscription.deleted":
        subscription = event["data"]["object"]
        sub_id = subscription["id"]

        print(f"🔔 Subscription {sub_id} ended")

        user_docs = db.collection("users").where("stripe_subscription_id", "==", sub_id).limit(1).stream()
        for doc in user_docs:
            doc.reference.update({
                "isPremium": False,
                "planType": "free",
                "stripe_subscription_id": None,
                "premium_activated_at": None,
                "cancelled": False,
                "cancelled_at": None,
                "remainingAttempts": {
                    "behavioral": 2,
                    "technical": 2,
                    "systemDesign": 1
                }
            })
            print(f"⚠️ Downgraded user for subscription {sub_id}")

    return {"status": "success"}

@router.post("/cancel-subscription")
async def cancel_subscription(req: CancelRequest):
    try:
        user_ref = db.collection("users").document(req.user_id)
        user_doc = user_ref.get()
        if not user_doc.exists:
            raise HTTPException(status_code=404, detail="User not found")

        user_data = user_doc.to_dict()
        sub_id = user_data.get("stripe_subscription_id")

        if not sub_id:
            raise HTTPException(status_code=400, detail="No subscription found to cancel")

        # Gracefully cancel at end of billing period
        stripe.Subscription.modify(sub_id, cancel_at_period_end=True)
        print(f"🛑 Stripe subscription {sub_id} scheduled for cancellation.")

        # Record cancel intent in Firestore
        user_ref.update({
            "cancelled": True,
            "cancelled_at": datetime.utcnow()
        })

        return {"message": "Subscription will end at the end of the billing period."}

    except stripe.error.StripeError as e:
        print("❌ Stripe cancellation failed:", e)
        raise HTTPException(status_code=500, detail="Stripe cancellation error")
    except Exception as e:
        print("❌ Cancel subscription error:", e)
        raise HTTPException(status_code=500, detail="Failed to cancel subscription")
