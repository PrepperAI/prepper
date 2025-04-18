// File: src/pages/TechnicalInterviewSession.js
import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import TechnicalInterview from "../TechnicalInterview";
import { useVoiceAgent } from "../../../hooks/useVoiceAgent";

const TechnicalInterviewSession = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const config = location.state;
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const { speakText, stopSpeaking, avatarRef } = useVoiceAgent({
    aiSpeaking,
    setAiSpeaking,
  });

  if (!config) {
    navigate("/interview/technical/setup");
    return null;
  }

  return (
    <TechnicalInterview
      config={config}
      avatarRef={avatarRef}
      aiSpeaking={aiSpeaking}
      speakText={speakText}
    />
  );
};

export default TechnicalInterviewSession;
