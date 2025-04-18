import React, { useState } from "react";
import styles from "./BehavioralInterview.module.css";

const EmoticonReactionBar = ({ onReactionSelect }) => {
  const [selectedReaction, setSelectedReaction] = useState(null);

  const reactions = [
    { emoji: "😊", label: "Happy", value: "happy" },
    { emoji: "🤔", label: "Thinking", value: "thinking" },
    { emoji: "😯", label: "Surprised", value: "surprised" },
    { emoji: "😥", label: "Nervous", value: "nervous" },
    { emoji: "👍", label: "Agree", value: "agree" },
  ];

  const handleReactionClick = (reaction) => {
    setSelectedReaction(reaction.value);
    if (onReactionSelect) {
      onReactionSelect(reaction.value);
    }
  };

  return (
    <div className={styles.reactionBar}>
      <div className={styles.reactionLabel}>How are you feeling?</div>
      <div className={styles.reactionEmoticons}>
        {reactions.map((reaction) => (
          <button
            key={reaction.value}
            className={`${styles.reactionButton} ${
              selectedReaction === reaction.value ? styles.selected : ""
            }`}
            onClick={() => handleReactionClick(reaction)}
            title={reaction.label}
          >
            <span role="img" aria-label={reaction.label}>
              {reaction.emoji}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default EmoticonReactionBar;
