import React from "react";
import styles from "./ResumeEditor.module.css";

const ResumeEditor = ({ resume, setResume, setSelectedBullet }) => {
  return (
    <div className={styles.container}>
      <h2>📌 Resume Bullets</h2>
      <ul className={styles.list}>
        {resume.map((item, idx) => (
          <li
            key={idx}
            className={styles.bullet}
            onClick={() => setSelectedBullet(item)}
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ResumeEditor;
