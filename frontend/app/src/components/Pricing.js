// src/components/Pricing.js
import React from "react";
import "./Pricing.css";

const plans = [
  {
    name: "Free",
    price: "$0",
    description: "Great for students and first-time users.",
    features: [
      "5 interview sessions / month",
      "Behavioral & Technical support",
      "Basic code editor + voice",
    ],
    highlight: false,
  },
  {
    name: "Pro",
    price: "$25/mo",
    description: "For professionals preparing for job transitions.",
    features: [
      "Unlimited interviews",
      "System Design & Presentation modes",
      "AI video avatar & whiteboard",
      "Interview history tracking",
    ],
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "Ideal for teams, bootcamps, and universities.",
    features: [
      "Team analytics dashboard",
      "Admin control panel",
      "Integration with LMS & ATS",
      "Priority support",
    ],
    highlight: false,
  },
];

const Pricing = () => {
  return (
    <section className="pricing-section">
      <h2 className="pricing-title">Pricing Plans</h2>
      <p className="pricing-subtext">
        Flexible plans for individuals and teams.
      </p>
      <div className="pricing-grid">
        {plans.map((plan, idx) => (
          <div
            key={idx}
            className={`pricing-card ${plan.highlight ? "highlight" : ""}`}
          >
            <h3>{plan.name}</h3>
            <h4 className="price">{plan.price}</h4>
            <p className="description">{plan.description}</p>
            <ul>
              {plan.features.map((feature, i) => (
                <li key={i}>✔ {feature}</li>
              ))}
            </ul>
            <button className="pricing-button">
              {plan.name === "Free" ? "Get Started" : "Choose Plan"}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Pricing;
