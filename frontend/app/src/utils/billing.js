import { API_BASE_URL } from "./api";

export const cancelSubscription = async (user_id) => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/cancel-subscription`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Cancellation failed");
    }

    return await res.json();
  } catch (err) {
    console.error("❌ Cancel subscription error:", err);
    throw err;
  }
};
