// src/utils/api.js

import { DID_API_KEY, DID_BASE_URL, BACKEND_BASE_URL } from "../constants";

export const startAvatarSession = async () => {
  const res = await fetch(`${BACKEND_BASE_URL}/start-session`, {
    method: "POST",
  });
  return await res.json();
};

export const sendSDPAnswer = async (sdp, sessionId, streamId) => {
  return await fetch(`${BACKEND_BASE_URL}/send-answer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sdp, session_id: sessionId, stream_id: streamId }),
  });
};

export const sendICECandidate = async (ice, sessionId, streamId) => {
  return await fetch(`${BACKEND_BASE_URL}/send-ice`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...ice,
      session_id: sessionId,
      stream_id: streamId,
    }),
  });
};

export const speakText = async (text, sessionId, streamId) => {
  console.log("✅ /api/avatar/speak is being triggered");
  return await fetch(`${BACKEND_BASE_URL}/speak`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, session_id: sessionId, stream_id: streamId }),
  });
};
