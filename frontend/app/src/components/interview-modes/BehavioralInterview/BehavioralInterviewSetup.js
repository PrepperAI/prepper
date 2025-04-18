import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import styles from "./BehavioralInterviewSetup.module.css";
import { useUser } from "../../../context/UserContext";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../firebase";

const BehavioralInterviewSetup = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const preselectedCompany = query.get("company");
  const { user } = useUser();

  const [level, setLevel] = useState("Entry");
  const [role, setRole] = useState("");
  const [locationPref, setLocationPref] = useState("");
  const [focusAreas, setFocusAreas] = useState([]);
  const [stress, setStress] = useState("Realistic");
  const [style, setStyle] = useState("Coach");
  const [resumes, setResumes] = useState([]);
  const [selectedResume, setSelectedResume] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [customCompany, setCustomCompany] = useState(preselectedCompany || "");

  const allFocusAreas = [
    "Teamwork",
    "Conflict",
    "Leadership",
    "Adaptability",
    "Communication",
  ];

  const toggleFocusArea = (area) => {
    setFocusAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    );
  };

  const fetchResumes = async () => {
    if (!user) return;
    const snap = await getDocs(collection(db, "users", user.uid, "resumes"));
    const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setResumes(data);
    if (data.length > 0) {
      setSelectedResume(data.find((r) => r.isDefault)?.url || data[0].url);
    }
  };

  useEffect(() => {
    fetchResumes();
  }, [user]);

  const handleSubmit = (e) => {
    e.preventDefault();

    const formData = {
      company: customCompany,
      level,
      role,
      location: locationPref,
      focusAreas,
      stress,
      style,
      resume: selectedResume,
      jobDescription,
    };

    navigate("/interview/behavioral/session", { state: formData });
  };

  return (
    <div className={styles.setupContainer}>
      <h1 className={styles.title}>Customize Your Interview</h1>
      <div className={styles.card}>
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label>Company</label>
            <input
              type="text"
              value={customCompany}
              placeholder="e.g. Google"
              onChange={(e) => setCustomCompany(e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label>Interview Level</label>
            <select value={level} onChange={(e) => setLevel(e.target.value)}>
              <option>Internship</option>
              <option>Entry</option>
              <option>Junior</option>
              <option>Mid</option>
              <option>Senior</option>
              <option>Lead</option>
            </select>
          </div>

          <div className={styles.field}>
            <label>Role / Position</label>
            <input
              type="text"
              value={role}
              placeholder="e.g. Software Engineer"
              onChange={(e) => setRole(e.target.value)}
              required
            />
          </div>

          <div className={styles.field}>
            <label>Location (Optional)</label>
            <input
              type="text"
              value={locationPref}
              placeholder="e.g. New York, Remote"
              onChange={(e) => setLocationPref(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label>Resume</label>
            <select
              value={selectedResume}
              onChange={(e) => setSelectedResume(e.target.value)}
            >
              {resumes.map((resume) => (
                <option key={resume.id} value={resume.url}>
                  {resume.name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label>Focus Areas</label>
            <div className={styles.checkboxGroup}>
              {allFocusAreas.map((area) => (
                <label key={area} className={styles.checkbox}>
                  <input
                    type="checkbox"
                    checked={focusAreas.includes(area)}
                    onChange={() => toggleFocusArea(area)}
                  />
                  {area}
                </label>
              ))}
            </div>
          </div>

          <div className={styles.field}>
            <label>Interview Style</label>
            <select value={style} onChange={(e) => setStyle(e.target.value)}>
              <option>Coach</option>
              <option>Evaluator</option>
            </select>
          </div>

          <div className={styles.field}>
            <label>Stress Level</label>
            <select value={stress} onChange={(e) => setStress(e.target.value)}>
              <option>Low</option>
              <option>Realistic</option>
              <option>High-pressure</option>
            </select>
          </div>

          <div className={styles.field}>
            <label>Job Description (Optional)</label>
            <textarea
              className={styles.textarea}
              value={jobDescription}
              placeholder="Paste a job description here if you have one"
              onChange={(e) => setJobDescription(e.target.value)}
              rows={6}
            />
          </div>

          <button type="submit" className={styles.startButton}>
            Start Interview
          </button>
        </form>
      </div>
    </div>
  );
};

export default BehavioralInterviewSetup;
