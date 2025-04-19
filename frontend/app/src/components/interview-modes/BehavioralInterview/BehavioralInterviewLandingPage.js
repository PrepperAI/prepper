// File: src/pages/BehavioralInterview.js
import React from "react";
import styles from "./BehavioralInterviewLandingPage.module.css";
import { useNavigate } from "react-router-dom";
import { Mic } from "lucide-react";

const companies = [
  "Google",
  "Amazon",
  "Meta",
  "Microsoft",
  "Netflix",
  "Apple",
  "Tesla",
  "Airbnb",
  "Stripe",
  "OpenAI",
];

const companyDomains = {
  Google: "google.com",
  Amazon: "amazon.com",
  Meta: "fb.com",
  Microsoft: "microsoft.com",
  Netflix: "netflix.com",
  Apple: "apple.com",
  Tesla: "tesla.com",
  Airbnb: "airbnb.com",
  Stripe: "stripe.com",
  OpenAI: "openai.com",
};

const BehavioralInterviewLandingPage = () => {
  const navigate = useNavigate();
  const handleStart = (company) => {
    if (company) {
      navigate(
        `/interview/behavioral/setup?company=${encodeURIComponent(company)}`
      );
    } else {
      navigate("/interview/behavioral/setup");
    }
  };
  return (
    <div className={styles.behavioralContainer}>
      <div className={styles.headerSection}>
        <h1 className={styles.title}>Behavioral Interview</h1>
        <p className={styles.subtitle}>
          Choose a mock interview mode or select a company to target.
        </p>
      </div>

      <div className={styles.optionGrid}>
        <div className={styles.card}>
          <Mic size={18} style={{ marginRight: 8 }} />
          <h3> General Mock Interview</h3>
          <p>Get randomly selected questions across categories and levels.</p>
          <button
            className={styles.startButton}
            onClick={() => handleStart(null)}
          >
            Start General Interview
          </button>
        </div>

        {companies.map((company, index) => (
          <div className={styles.card} key={index}>
            <img
              className={styles.companyLogo}
              src={`https://logo.clearbit.com/${companyDomains[company]}`}
              alt={`${company} logo`}
            />
            <h3>{company}</h3>
            <p>Practice questions tailored for {company} interviews.</p>
            <button
              className={styles.startButton}
              onClick={() => handleStart(company)}
            >
              Start {company} Interview
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BehavioralInterviewLandingPage;
