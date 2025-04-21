// src/components/UpgradeButton.js
import React from "react";
import { loadStripe } from "@stripe/stripe-js";
import { useUser } from "../context/UserContext";
import styles from "../pages/Dashboard.module.css";
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

const UpgradeButton = () => {
  const { user } = useUser();

  const handleUpgrade = async () => {
    const res = await fetch("/api/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: user?.email }),
    });

    const data = await res.json();
    console.log("🔥 Stripe session response:", data); // Add this
    const stripe = await stripePromise;
    await stripe.redirectToCheckout({ sessionId: data.sessionId });
  };

  return (
    <button onClick={handleUpgrade} className={styles.upgradeButton}>
      Upgrade
    </button>
  );
};

export default UpgradeButton;
