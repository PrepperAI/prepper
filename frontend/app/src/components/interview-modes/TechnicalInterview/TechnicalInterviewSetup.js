import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../firebase";
import { useUser } from "../../../context/UserContext";
import styles from "./TechnicalInterviewSetup.module.css";

const TechnicalInterviewSetup = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();
  const focusArea = location.state?.focusArea || "";

  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const [level, setLevel] = useState("Entry");
  const [difficulty, setDifficulty] = useState("Medium");
  const [locationPref, setLocationPref] = useState("");
  const [resumes, setResumes] = useState([]);
  const [selectedResume, setSelectedResume] = useState("");

  useEffect(() => {
    const fetchResumes = async () => {
      if (!user) return;
      const snap = await getDocs(collection(db, "users", user.uid, "resumes"));
      const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setResumes(data);
    };
    fetchResumes();
  }, [user]);

  const handleSubmit = (e) => {
    console.log("HEre is your resume", selectedResume);
    e.preventDefault();
    const config = {
      interview_type: "technical",
      role,
      company,
      experience_level: level,
      location: locationPref,
      focus_area: focusArea,
      difficulty,
      style: "Evaluator",
      resume: selectedResume,
    };
    navigate("/interview/technical/session", { state: config });
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Customize Your Interview</h1>
      <div className={styles.card}>
        <form className={styles.form} onSubmit={handleSubmit}>
          <label>
            Interview Level
            <select value={level} onChange={(e) => setLevel(e.target.value)}>
              <option value="Entry">Entry</option>
              <option value="Junior">Junior</option>
              <option value="Mid">Mid</option>
              <option value="Senior">Senior</option>
            </select>
          </label>

          <label>
            Difficulty
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
            >
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </label>

          <label>
            Role / Position
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Software Engineer"
              required
            />
          </label>

          <label>
            Location (Optional)
            <input
              type="text"
              value={locationPref}
              onChange={(e) => setLocationPref(e.target.value)}
              placeholder="e.g. New York, Remote"
            />
          </label>

          <label>
            Focus Area
            <input
              type="text"
              value={focusArea}
              readOnly
              className={styles.readOnlyInput}
            />
          </label>

          <label>
            Company (Optional)
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g. Google"
            />
          </label>

          <label>
            Resume (Optional)
            <select
              value={selectedResume}
              onChange={(e) => setSelectedResume(e.target.value)}
            >
              <option value="">Select a resume</option>
              {resumes.map((r) => (
                <option key={r.id} value={r.url}>
                  {r.name}
                </option>
              ))}
            </select>
          </label>

          <button type="submit" className={styles.startButton}>
            Start Interview
          </button>
        </form>
      </div>
    </div>
  );
};

export default TechnicalInterviewSetup;
