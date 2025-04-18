import React from "react";
import styles from "./BehavioralInterview.module.css";

const LoadingOverlay = ({ message = "Preparing your interview..." }) => {
  return (
    <div className={styles.initializing}>
      <div className={styles.loader}></div>
      <p>{message}</p>
      <p className={styles.loadingSubtext}>This may take a few seconds</p>
    </div>
  );
};

export default LoadingOverlay;
