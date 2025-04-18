import React, { useEffect, useState } from "react";
import { useUser } from "../../context/UserContext";
import { collection, getDocs, getFirestore } from "firebase/firestore";
import styles from "./FeedbackList.module.css";
import { ClipboardList, Eye, X } from "lucide-react";

const FeedbackList = () => {
  const { user } = useUser();
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFeedback, setSelectedFeedback] = useState(null);

  useEffect(() => {
    const fetchFeedbacks = async () => {
      const db = getFirestore();
      const types = ["behavioral", "technical", "system_design"];
      let result = [];

      for (const type of types) {
        const sessionsRef = collection(
          db,
          `${type}_sessions`,
          user.uid,
          "sessions"
        );
        const snap = await getDocs(sessionsRef);

        snap.forEach((doc) => {
          const data = doc.data();
          if (data.feedback || data.feedback_fallback_markdown) {
            result.push({
              id: doc.id,
              type,
              role: data.job_role || "-",
              level: data.level || "-",
              date: data.feedback_generated_at
                ?.toDate()
                .toISOString()
                .split("T")[0],
              format: data.feedback ? "json" : "markdown",
              feedback: data.feedback,
              markdown: data.feedback_fallback_markdown,
            });
          }
        });
      }

      result.sort((a, b) => new Date(b.date) - new Date(a.date));
      setFeedbacks(result);
      setLoading(false);
    };

    fetchFeedbacks();
  }, [user]);

  if (loading) {
    return (
      <div className={styles.scheduleContainer}>
        <p className={styles.loadingState}>Loading feedback...</p>
      </div>
    );
  }

  return (
    <div className={styles.scheduleContainer}>
      <h2 className={styles.title}>
        <ClipboardList size={20} style={{ marginRight: 8 }} /> Your Feedback
      </h2>

      {feedbacks.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No feedback yet.</p>
        </div>
      ) : (
        <table className={styles.scheduleTable}>
          <thead>
            <tr>
              <th>Type</th>
              <th>Role</th>
              <th>Level</th>
              <th>Date</th>
              <th>Format</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {feedbacks.map((fb, index) => (
              <tr key={index}>
                <td>{fb.type}</td>
                <td>{fb.role}</td>
                <td>{fb.level}</td>
                <td>{fb.date}</td>
                <td>{fb.format}</td>
                <td>
                  <button
                    className={styles.iconButton}
                    title="View"
                    onClick={() => setSelectedFeedback(fb)}
                  >
                    <Eye size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {selectedFeedback && (
        <div className={styles.rescheduleModal}>
          <div className={styles.modalContent}>
            <h3 className={styles.modalTitle}>Feedback Details</h3>
            <button
              className={styles.closeBtn}
              onClick={() => setSelectedFeedback(null)}
              title="Close"
            >
              <X size={18} />
            </button>

            {selectedFeedback.format === "json" ? (
              <>
                <h4>Summary</h4>
                <p>{selectedFeedback.feedback.summary}</p>

                <h4>Strengths</h4>
                <ul>
                  {selectedFeedback.feedback.strengths.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>

                <h4>Areas for Improvement</h4>
                <ul>
                  {selectedFeedback.feedback.improvements.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>

                <h4>Resources</h4>
                <ul>
                  {selectedFeedback.feedback.resources.map((r, i) => (
                    <li key={i}>
                      <a href={r.url} target="_blank" rel="noreferrer">
                        {r.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <pre style={{ whiteSpace: "pre-wrap", color: "#f1f5f9" }}>
                {selectedFeedback.markdown}
              </pre>
            )}

            <div className={styles.modalActions}>
              <button onClick={() => setSelectedFeedback(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedbackList;
