import React, { useRef, useEffect, useState } from "react";
import styles from "./BehavioralInterview.module.css";

const TranscriptView = ({ conversationLog, aiSpeaking }) => {
  const scrollRef = useRef(null);
  const [lastMsgIndex, setLastMsgIndex] = useState(-1);

  useEffect(() => {
    if (conversationLog.length > lastMsgIndex + 1) {
      setLastMsgIndex(conversationLog.length - 1);
    }
  }, [conversationLog, lastMsgIndex]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversationLog]);

  const renderMessage = (content) => {
    if (!content) return null;

    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = content.split(urlRegex);

    return parts.map((part, i) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#00eaff", textDecoration: "underline" }}
          >
            {part}
          </a>
        );
      }

      const boldParts = part.split(/(\*\*.*?\*\*)/g);
      return boldParts.map((boldPart, j) => {
        if (boldPart.startsWith("**") && boldPart.endsWith("**")) {
          return <strong key={`${i}-${j}`}>{boldPart.slice(2, -2)}</strong>;
        }

        const italicParts = boldPart.split(/(_.*?_)/g);
        return italicParts.map((italicPart, k) => {
          if (italicPart.startsWith("_") && italicPart.endsWith("_")) {
            return <em key={`${i}-${j}-${k}`}>{italicPart.slice(1, -1)}</em>;
          }
          return italicPart;
        });
      });
    });
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case "user":
        return "You";
      case "ai":
        return "Interviewer";
      case "system":
        return "System";
      default:
        return role.charAt(0).toUpperCase() + role.slice(1);
    }
  };

  return (
    <div className={styles.transcriptContainer}>
      <div className={styles.transcriptScroll} ref={scrollRef}>
        {conversationLog.map((entry, index) => {
          const isSystemMessage = entry.role === "system";
          const isNewMessage = index === lastMsgIndex && index > 0;

          const baseClass =
            entry.role === "user" ? styles.userEntry : styles.aiEntry;

          const inlineFontStyle = {
            fontSize: "0.9rem",
            ...(isSystemMessage ? { opacity: 0.7 } : {}),
          };

          return (
            <div
              key={index}
              className={`${baseClass} ${
                isNewMessage ? styles.newMessage : ""
              } ${isSystemMessage ? styles.systemMessage : ""}`}
              style={inlineFontStyle}
            >
              <strong>{getRoleLabel(entry.role)}:</strong>{" "}
              {renderMessage(entry.content)}
              {entry.note && <em className={styles.noteText}> {entry.note}</em>}
            </div>
          );
        })}

        {aiSpeaking && conversationLog.length > 0 && (
          <div
            className={`${styles.aiEntry} ${styles.typingIndicator}`}
            style={{ fontSize: "0.9rem" }}
          >
            <div className={styles.typingDots}>
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
      </div>

      {aiSpeaking && (
        <div className={styles.aiSpeakingIndicator}>AI is speaking</div>
      )}
    </div>
  );
};

export default TranscriptView;
