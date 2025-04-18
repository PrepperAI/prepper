import React, { useRef } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./SystemDesignLandingPage.module.css";
import { Wrench, LayoutPanelTop, BarChart2, MessageSquare } from "lucide-react";

const systems = [
  { name: "Instagram", logo: "/logos/instagram.svg" },
  { name: "Uber", logo: "/logos/uber.svg" },
  { name: "YouTube", logo: "/logos/youtube.svg" },
  { name: "Twitter", logo: "/logos/twitter.svg" },
  { name: "WhatsApp", logo: "/logos/whatsapp.svg" },
  { name: "Dropbox", logo: "/logos/dropbox.svg" },
];

const SystemDesignLanding = () => {
  const navigate = useNavigate();
  const popularRef = useRef(null);

  const scrollToPopular = () => {
    if (popularRef.current) {
      popularRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleSystemClick = (system) => {
    navigate("/interview/system-design/setup", {
      state: { focusSystem: system },
    });
  };

  const handleCustomize = () => {
    navigate("/interview/system-design/setup");
  };

  return (
    <div className={styles.container}>
      <header className={styles.hero}>
        <h1>Master Real-World System Design</h1>
        <p>
          Practice scalable architecture interviews with an AI senior engineer.
          Get real-time feedback and build confidence for your next big
          opportunity.
        </p>
        <div className={styles.heroActions}>
          <button
            onClick={() => {
              scrollToPopular();
            }}
          >
            Start With Popular System
          </button>
          <button onClick={handleCustomize}>Customize My Session</button>
        </div>
      </header>

      <section className={styles.skillsGrid}>
        <h2>What You'll Learn</h2>
        <div className={styles.skills}>
          <div className={styles.skillCard}>
            <Wrench size={18} /> Architecture Fundamentals
          </div>
          <div className={styles.skillCard}>
            <LayoutPanelTop size={18} /> Component Thinking
          </div>
          <div className={styles.skillCard}>
            <BarChart2 size={18} /> Tradeoff Reasoning
          </div>
          <div className={styles.skillCard}>
            <MessageSquare size={18} /> Whiteboard Communication
          </div>
        </div>
      </section>

      {/* ✅ Scroll Target Section */}
      <section ref={popularRef} className={styles.popularSystems}>
        <h2>Popular Systems You Can Practice</h2>
        <div className={styles.cards}>
          {systems.map(({ name, logo }) => (
            <div
              key={name}
              className={styles.systemCard}
              onClick={() => handleSystemClick(name)}
            >
              <img
                src={logo}
                alt={`${name} logo`}
                className={styles.systemLogo}
              />
              <span>{name}</span>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.bottomCTA}>
        <h2>Ready to start?</h2>
        <button onClick={handleCustomize}>Start Designing</button>
      </section>
    </div>
  );
};

export default SystemDesignLanding;
