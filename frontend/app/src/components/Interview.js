import React, { useState, useRef, useEffect } from "react";
import TechnicalInterview from "./interview-modes/TechnicalInterview";
import BehavioralInterview from "./interview-modes/BehavioralInterview";
import LoadingScreen from "./LoadingScreen";
import { useVoiceAgent } from "../hooks/useVoiceAgent";
import { buildInterviewConfig } from "../utils/interviewUtils";

const Interview = ({ mode = "Behavioral" }) => {
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [config, setConfig] = useState(null);
  const { speakText, avatarRef } = useVoiceAgent({ aiSpeaking, setAiSpeaking });

  useEffect(() => {
    setConfig(buildInterviewConfig(mode));
  }, [mode]);
  //guard this from mounting the behavioral component
  if (!config) return <LoadingScreen message="Setting up your interview..." />;

  return (
    <div className="main-content">
      {config?.interview_type === "Technical" ? (
        <TechnicalInterview
          config={config}
          aiSpeaking={aiSpeaking}
          transcript={transcript}
          avatarRef={avatarRef}
          speakText={speakText}
        />
      ) : (
        <BehavioralInterview
          config={config}
          avatarRef={avatarRef}
          aiSpeaking={aiSpeaking}
          speakText={speakText}
        />
      )}
    </div>
  );
};

export default Interview;
