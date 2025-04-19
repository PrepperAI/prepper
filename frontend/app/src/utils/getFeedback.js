import { endBefore } from "firebase/firestore";
import { API_BASE_URL } from "./api";

export const generateFeedback = async ({
  interview_type,
  user_id,
  session_id,
  job_role,
  level,
  style,
  endpointCompletion,
}) => {
  try {
    const endpoint = `${API_BASE_URL}/api/feedback/${endpointCompletion}`;
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id,
        session_id,
        interview_type,
        job_role,
        level,
        style,
      }),
    });

    const data = await res.json();
    console.log("✅ Feedback generated:", data);
    return data;
  } catch (err) {
    console.error("❌ Failed to generate feedback:", err);
    return null;
  }
};
