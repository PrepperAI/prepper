import React, { useState } from "react";
import ResumeEditor from "./ResumeEditor";
import GPTSuggestionBox from "./GPTSuggestionBox";
import ExportResume from "./ExportResume";
import JobDescriptionUpload from "./JobDescriptionUpload";
import styles from "./ResumeCopilot.module.css";

const ResumeCopilot = () => {
  const [resume, setResume] = useState([
    "Designed a scalable backend system using Node.js and PostgreSQL.",
    "Led a team of 3 interns to complete 2 product features in under 2 months.",
    "Reduced page load time by 45% via code-splitting and lazy loading.",
  ]);

  const [jobDescription, setJobDescription] = useState("");
  const [selectedBullet, setSelectedBullet] = useState(null);

  return (
    <div className={styles.container}>
      <h1 className={styles.header}>📄 Resume Copilot</h1>

      <JobDescriptionUpload
        jobDescription={jobDescription}
        setJobDescription={setJobDescription}
      />

      <div className={styles.editorSection}>
        <ResumeEditor
          resume={resume}
          setResume={setResume}
          setSelectedBullet={setSelectedBullet}
        />

        <GPTSuggestionBox
          bullet={selectedBullet}
          jobDescription={jobDescription}
          onUpdate={(newBullet) => {
            const updated = [...resume];
            const index = resume.indexOf(selectedBullet);
            if (index !== -1) {
              updated[index] = newBullet;
              setResume(updated);
              setSelectedBullet(null);
            }
          }}
        />
      </div>

      <ExportResume resume={resume} />
    </div>
  );
};

export default ResumeCopilot;
