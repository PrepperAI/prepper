import React from "react";
import styles from "./JobDescriptionUpload.module.css";

const JobDescriptionUpload = ({ jobDescription, setJobDescription }) => {
  return (
    <div className={styles.container}>
      <h2>📎 Upload Job Description (Optional)</h2>
      <textarea
        className={styles.textarea}
        rows="6"
        placeholder="Paste the job description here..."
        value={jobDescription}
        onChange={(e) => setJobDescription(e.target.value)}
      />
    </div>
  );
};

export default JobDescriptionUpload;
