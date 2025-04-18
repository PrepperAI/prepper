import React from "react";
import styles from "./ResumePreviewModal.module.css";

const ResumePreviewModal = ({ url, onClose }) => {
  if (!url) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h3>📄 Preview</h3>
          <button className={styles.closeBtn} onClick={onClose}>
            ✖
          </button>
        </div>
        <iframe
          src={url}
          title="Resume Preview"
          className={styles.pdfViewer}
          frameBorder="0"
        />
      </div>
    </div>
  );
};

export default ResumePreviewModal;
