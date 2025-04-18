// import React, { useState } from "react";
// import { useLocation, useNavigate } from "react-router-dom";
// import styles from "./SystemDesignSetup.module.css";

// const SystemDesignSetup = () => {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const focusSystem = location.state?.focusSystem || "";

//   const [experienceLevel, setExperienceLevel] = useState("Entry");
//   const [jobRole, setJobRole] = useState("");
//   const [company, setCompany] = useState("");
//   const [locationPref, setLocationPref] = useState("");
//   const [style, setStyle] = useState("Evaluator");

//   const handleStart = (e) => {
//     e.preventDefault();
//     const config = {
//       interview_type: "system_design",
//       system: focusSystem,
//       experience_level: experienceLevel,
//       job_role: jobRole,
//       company,
//       location: locationPref,
//       style,
//     };

//     navigate("/interview/system/session", { state: config });
//   };

//   return (
//     <div className={styles.container}>
//       <h1 className={styles.title}>Customize Your System Design Interview</h1>
//       <div className={styles.card}>
//         <form className={styles.form} onSubmit={handleStart}>
//           <label>
//             System to Design
//             <input
//               type="text"
//               value={focusSystem}
//               readOnly
//               className={styles.readOnlyInput}
//             />
//           </label>

//           <label>
//             Experience Level
//             <select
//               value={experienceLevel}
//               onChange={(e) => setExperienceLevel(e.target.value)}
//             >
//               <option value="Entry">Entry</option>
//               <option value="Mid">Mid</option>
//               <option value="Senior">Senior</option>
//             </select>
//           </label>

//           <label>
//             Job Role
//             <input
//               type="text"
//               value={jobRole}
//               onChange={(e) => setJobRole(e.target.value)}
//               placeholder="e.g. Backend Engineer"
//               required
//             />
//           </label>

//           <label>
//             Company (Optional)
//             <input
//               type="text"
//               value={company}
//               onChange={(e) => setCompany(e.target.value)}
//               placeholder="e.g. Google"
//             />
//           </label>

//           <label>
//             Location (Optional)
//             <input
//               type="text"
//               value={locationPref}
//               onChange={(e) => setLocationPref(e.target.value)}
//               placeholder="e.g. Remote"
//             />
//           </label>

//           <label>
//             Interview Style
//             <select value={style} onChange={(e) => setStyle(e.target.value)}>
//               <option value="Evaluator">Evaluator</option>
//               <option value="Collaborator">Collaborator</option>
//             </select>
//           </label>

//           <button type="submit" className={styles.startButton}>
//             Start Interview
//           </button>
//         </form>
//       </div>
//     </div>
//   );
// };

// export default SystemDesignSetup;
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import styles from "./SystemDesignSetup.module.css";
import { db } from "../../firebase";
import { collection, getDocs } from "firebase/firestore";
import { useUser } from "../../context/UserContext";

const SystemDesignSetup = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const focusSystem = location.state?.focusSystem || "";
  const { user } = useUser();

  const [experienceLevel, setExperienceLevel] = useState("Entry");
  const [jobRole, setJobRole] = useState("");
  const [company, setCompany] = useState("");
  const [locationPref, setLocationPref] = useState("");
  const [style, setStyle] = useState("Evaluator");
  const [resumes, setResumes] = useState([]);
  const [selectedResume, setSelectedResume] = useState("");

  useEffect(() => {
    const fetchResumes = async () => {
      if (!user) return;
      const snap = await getDocs(collection(db, "users", user.uid, "resumes"));
      const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setResumes(data);
      const defaultResume = data.find((r) => r.isDefault);
      if (defaultResume) setSelectedResume(defaultResume.url);
    };
    fetchResumes();
  }, [user]);

  const handleStart = (e) => {
    e.preventDefault();
    const config = {
      interview_type: "system_design",
      system: focusSystem,
      experience_level: experienceLevel,
      job_role: jobRole,
      company,
      location: locationPref,
      style,
      resume: selectedResume,
    };

    navigate("/interview/system/session", { state: config });
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Customize Your System Design Interview</h1>
      <div className={styles.card}>
        <form className={styles.form} onSubmit={handleStart}>
          <label>
            System to Design
            <input
              type="text"
              value={focusSystem}
              readOnly
              className={styles.readOnlyInput}
            />
          </label>

          <label>
            Experience Level
            <select
              value={experienceLevel}
              onChange={(e) => setExperienceLevel(e.target.value)}
            >
              <option value="Entry">Entry</option>
              <option value="Mid">Mid</option>
              <option value="Senior">Senior</option>
            </select>
          </label>

          <label>
            Job Role
            <input
              type="text"
              value={jobRole}
              onChange={(e) => setJobRole(e.target.value)}
              placeholder="e.g. Backend Engineer"
              required
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
            Location (Optional)
            <input
              type="text"
              value={locationPref}
              onChange={(e) => setLocationPref(e.target.value)}
              placeholder="e.g. Remote"
            />
          </label>

          <label>
            Interview Style
            <select value={style} onChange={(e) => setStyle(e.target.value)}>
              <option value="Evaluator">Evaluator</option>
              <option value="Collaborator">Collaborator</option>
            </select>
          </label>

          <label>
            Select Resume
            <select
              value={selectedResume}
              onChange={(e) => setSelectedResume(e.target.value)}
              required
            >
              <option value="">-- Choose a resume --</option>
              {resumes.map((resume) => (
                <option key={resume.id} value={resume.url}>
                  {resume.name}
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

export default SystemDesignSetup;
