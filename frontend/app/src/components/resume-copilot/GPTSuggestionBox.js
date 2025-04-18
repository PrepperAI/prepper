import React, { useState } from "react";
import styles from "./GPTSuggestionBox.module.css";

const GPTSuggestionBox = ({ bullet, jobDescription, onSuggestions }) => {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [error, setError] = useState("");

  const handleGetSuggestions = async () => {
    setLoading(true);
    setError("");
    setSuggestions([]);

    try {
      const res = await fetch("http://localhost:8000/api/resume/suggest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bullet,
          job_description: jobDescription || "",
        }),
      });

      if (!res.ok) throw new Error("Something went wrong");
      const data = await res.json();

      if (!data || !data.suggestions || data.suggestions.length === 0) {
        throw new Error("No suggestions returned.");
      }

      setSuggestions(data.suggestions);
      if (onSuggestions) onSuggestions(data.suggestions);
    } catch (err) {
      console.error("❌ GPT Error:", err);
      setError("Failed to fetch suggestions. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.box}>
      <button onClick={handleGetSuggestions} disabled={loading}>
        {loading ? "Getting suggestions..." : "Improve this bullet"}
      </button>

      {error && <p className={styles.error}>{error}</p>}

      {suggestions.length > 0 && (
        <ul className={styles.suggestions}>
          {suggestions.map((suggestion, index) => (
            <li key={index}>{suggestion}</li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default GPTSuggestionBox;
