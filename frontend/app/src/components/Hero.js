// src/components/Hero.js
import React from "react";
import "./Hero.css";

const Hero = () => {
  return (
    <section className="hero-section">
      <div className="hero-content">
        <h1>
          Ace Your Next Interview <br />
          <span className="highlight">With Confidence.</span>
        </h1>
        <p className="subtext">
          Prepper is your personal AI coach, conducting realistic interviews
          across 100+ roles across 100+.
        </p>
        <div className="hero-buttons">
          <button className="primary-btn">Try a Demo</button>
          <button className="secondary-btn">Explore Interview Types</button>
        </div>
      </div>
    </section>
  );
};

export default Hero;
