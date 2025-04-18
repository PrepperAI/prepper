// src/components/Features.js
import React from "react";
import "./Features.css";

const Features = () => {
  const features = [
    {
      title: "100+ Interview Types",
      description:
        "From software engineering to product management, Prepper adapts to your role.",
    },
    {
      title: "Real-Time Feedback",
      description:
        "AI voice and video feedback that simulates real interview pressure and pacing.",
    },
    {
      title: "Multimodal Support",
      description:
        "Supports voice, code editor, whiteboard, and slide-based presentations.",
    },
    {
      title: "Schedule Practice Sessions",
      description:
        "Book interviews at your pace, or simulate impromptu recruiter calls.",
    },
    {
      title: "Personalized Interview Paths",
      description:
        "Get tailored questions based on your resume, role, and experience level.",
    },
    {
      title: "Interview History + Analytics",
      description:
        "Review past interviews, AI feedback, and track growth over time.",
    },
  ];

  return (
    <section className="features-section">
      <h2 className="features-heading">Why Prepper?</h2>
      <p className="features-subtext">
        Built for tech professionals across all experience levels.
      </p>
      <div className="features-grid">
        {features.map((feature, index) => (
          <div className="feature-card" key={index}>
            <h3>{feature.title}</h3>
            <p>{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Features;
