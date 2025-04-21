import React from "react";
import styles from "./BlockedModal.module.css";
import { useNavigate } from "react-router-dom";
import UpgradeButton from "./UpgradeButton";
import { X, ShieldAlert } from "lucide-react";

const BlockedModal = ({ onClose }) => {
  const navigate = useNavigate();

  const handleClose = () => {
    navigate("/dashboard/home");
    if (onClose) onClose();
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <button className={styles.closeIcon} onClick={handleClose}>
          <X size={20} />
        </button>

        <div className={styles.header}>
          <ShieldAlert size={28} />
          <h2>You’ve run out of attempts</h2>
        </div>

        <p>
          Upgrade to <strong>Premium</strong> for unlimited practice interviews
          and personalized feedback.
        </p>

        <div className={styles.actions}>
          <button className={styles.backBtn} onClick={handleClose}>
            Go Back
          </button>
          <UpgradeButton />
        </div>
      </div>
    </div>
  );
};

export default BlockedModal;
