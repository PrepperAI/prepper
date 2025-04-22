import React from "react";
import "./Hero.css";
import { CalendarClock, BarChart3, UsersRound } from "lucide-react";

const Hero = () => {
  return (
    <section className="hero-section">
      <div className="hero-content">
        <h1>
          Ace Your Next Interview <br />
          <span className="highlight">With Confidence.</span>
        </h1>
        <p className="subtext">
          Prepper is your personal AI coach — practicing behavioral, technical,
          and system design interviews with real-time feedback. Designed for
          every role, from Software Engineering to Product Management.
        </p>
        <div className="hero-grid">
          <div className="hero-box">
            <UsersRound className="hero-icon" />
            Personalized Mock Interviews <br />
            <span className="hero-box-sub">Behavioral, Technical & More</span>
          </div>
          <div className="hero-box">
            <BarChart3 className="hero-icon" />
            AI Feedback Engine <br />
            <span className="hero-box-sub">Instant breakdowns & coaching</span>
          </div>
          <div className="hero-box">
            <CalendarClock className="hero-icon" />
            Schedule Live Sessions <br />
            <span className="hero-box-sub">
              Practice with real voice + video
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
