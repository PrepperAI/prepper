import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import SystemDesignInterview from "./SystemDesignInterview"; // Update path if needed

const SystemDesignSession = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const config = location.state;

  if (!config) {
    // If config is missing, redirect to landing
    navigate("/interview/system");
    return null;
  }

  return <SystemDesignInterview config={config} />;
};

export default SystemDesignSession;
