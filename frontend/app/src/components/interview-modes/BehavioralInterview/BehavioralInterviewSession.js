import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import BehavioralInterview from "../BehavioralInterview";
import { useVoiceAgent } from "../../../hooks/useVoiceAgent";

const BehavioralInterviewSession = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const config = location.state;

  if (!config) {
    navigate("/interview/behavioral/setup");
    return null;
  }

  return <BehavioralInterview config={config} />;
};

export default BehavioralInterviewSession;
