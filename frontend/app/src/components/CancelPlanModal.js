import React from "react";
import styles from "./CancelPlanModal.module.css";

const CancelPlanModal = ({ open, onConfirm, onCancel }) => {
  if (!open) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h3>Cancel Subscription</h3>
        <p>
          Are you sure you want to cancel your premium subscription? You’ll
          still have access until your billing period ends.
        </p>
        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onCancel}>
            Never mind
          </button>
          <button className={styles.confirmBtn} onClick={onConfirm}>
            Yes, Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default CancelPlanModal;
