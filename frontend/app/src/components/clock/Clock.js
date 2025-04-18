import React, { useEffect, useState } from "react";

const Clock = ({ durationMinutes = 15, onEnd }) => {
  const [timeLeft, setTimeLeft] = useState(durationMinutes * 60);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onEnd?.(); // trigger end interview
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [onEnd]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div style={{ fontFamily: "Orbitron", fontSize: "1rem", color: "#66f0ff" }}>
      ⏳ {formatTime(timeLeft)}
    </div>
  );
};

export default Clock;
