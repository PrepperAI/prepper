// BlockedModal.js
import React from "react";
import styles from "./BlockedModal.module.css";
import { useNavigate } from "react-router-dom";
import UpgradeButton from "./UpgradeButton"; // Assuming you already built this

const BlockedModal = ({ onClose }) => {
  const navigate = useNavigate();

  const handleClose = () => {
    navigate("/dashboard/home"); // ✅ Redirect to dashboard home
    if (onClose) onClose();
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2>🚫 You've run out of attempts</h2>
        <p>
          Upgrade to Premium for unlimited practice interviews, or schedule a
          real mock interview with a coach.
        </p>

        <div className={styles.actions}>
          <UpgradeButton />
          <button
            className={styles.coach}
            onClick={() => navigate("/schedule")}
          >
            📅 Schedule a Coach
          </button>
        </div>

        <button className={styles.close} onClick={handleClose}>
          Close
        </button>
      </div>
    </div>
  );
};

export default BlockedModal;
