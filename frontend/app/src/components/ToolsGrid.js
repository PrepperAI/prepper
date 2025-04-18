import React from "react";
import "./ToolsGrid.css"; // Make sure to create this for styling

const tools = [
  "Software Engineering",
  "Product Management",
  "Data Science",
  "Marketing",
  "Sales",
  "Finance",
  "Design",
  "Human Resources",
  "Consulting",
  "Customer Support",
  "Cybersecurity",
  "AI/ML",
  "Cloud Computing",
  "Legal",
  "Healthcare",
  "Education",
  "Operations",
  "IT Support",
  "Project Management",
  "Business Analysis",
  // ... add more to simulate 100+
];

const ToolsGrid = () => {
  return (
    <section className="tools-grid-section">
      <h2 className="tools-title">
        100+ Interview Types Across All Industries
      </h2>
      <p className="tools-subtext">
        Whether you're a developer, designer, marketer, or executive—MockArena
        has you covered.
      </p>
      <div className="tools-grid">
        {tools.map((tool, index) => (
          <div key={index} className="tool-card">
            {tool}
          </div>
        ))}
      </div>
    </section>
  );
};

export default ToolsGrid;
