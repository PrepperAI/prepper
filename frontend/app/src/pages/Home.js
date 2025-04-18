import React from "react";
import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div className="intro-section">
      <h1 className="title-glow">Mock AI Interview Platform</h1>
      <h2>Select a Tool</h2>
      <div className="interview-options">
        <Link to="/behavioral">
          <button className="interview-button">Behavioral Interview</button>
        </Link>
        <Link to="/technical">
          <button className="interview-button">Technical Interview</button>
        </Link>
        <Link to="/presentation">
          <button className="interview-button">Presentation Mock</button>
        </Link>
        <Link to="/resume">
          <button className="interview-button">Resume Copilot</button>
        </Link>
        <Link to="/system-design">
          <button className="interview-button">System Design</button>
        </Link>
        <Link to="/auth-test">
          <button className="interview-button">TestAuth</button>
        </Link>
      </div>
    </div>
  );
};

export default Home;
