import React from "react";
import styles from "./ExportResume.module.css";

const ExportResume = ({ resume }) => {
  const downloadTextFile = () => {
    const blob = new Blob([resume.join("\n")], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "resume.txt";
    link.click();
  };

  return (
    <div className={styles.container}>
      <button onClick={downloadTextFile}>⬇️ Download Resume as TXT</button>
    </div>
  );
};

export default ExportResume;
