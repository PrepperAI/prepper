import React, { useState } from "react";
import { useUser } from "../../context/UserContext";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { CalendarPlus, ArrowRight, Clock } from "lucide-react";
import "./ScheduleInterview.css";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../utils/api";

const generateGoogleCalendarLink = (startDate, durationMinutes = 30) => {
  const start = new Date(startDate);
  const end = new Date(start.getTime() + durationMinutes * 60000);

  const formatDate = (date) => {
    return date.toISOString().replace(/-|:|\.\d+/g, "");
  };

  const startStr = formatDate(start);
  const endStr = formatDate(end);

  const baseUrl = "https://calendar.google.com/calendar/render";
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: "Interview with Prepper",
    dates: `${startStr}/${endStr}`,
    details: "Mock interview scheduled via Prepper",
    location: "https://prepper.ai",
  });

  return `${baseUrl}?${params.toString()}`;
};

const ScheduleInterview = () => {
  const { user } = useUser();
  const [type, setType] = useState("technical");
  const [role, setRole] = useState("");
  const [level, setLevel] = useState("");
  const [dateTime, setDateTime] = useState(null);
  const [timezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user || !dateTime) return;

    setLoading(true);
    setStatus(null);
    setSuccess(false);

    const date = dateTime.toISOString().split("T")[0];
    const time = dateTime.toTimeString().split(" ")[0].slice(0, 5);

    try {
      const res = await fetch(`${API_BASE_URL}/api/schedule`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: user.uid,
          type,
          role,
          level,
          date,
          time,
          timezone,
        }),
      });

      if (!res.ok) throw new Error("Failed to schedule");

      setSuccess(true);
      setStatus("Interview scheduled successfully!");
    } catch (err) {
      console.error("❌ Error scheduling interview:", err);
      setStatus("Failed to schedule interview.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="schedule-container">
      <h2>
        <CalendarPlus size={20} /> Schedule an Interview
      </h2>

      <form onSubmit={handleSubmit} className="schedule-form">
        <label>
          Interview Type:
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="behavioral">Behavioral</option>
            <option value="technical">Technical Coding</option>
            <option value="system_design">System Design</option>
          </select>
        </label>

        <label>
          Role (optional):
          <input
            type="text"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          />
        </label>

        <label>
          Experience Level (e.g. newgrad, junior, senior):
          <input
            type="text"
            value={level}
            onChange={(e) => setLevel(e.target.value)}
          />
        </label>

        <label>
          Date & Time:
          <DatePicker
            selected={dateTime}
            onChange={(date) => setDateTime(date)}
            showTimeSelect
            timeIntervals={15}
            dateFormat="Pp"
            minDate={new Date()}
            placeholderText="Select date and time"
            className="datepicker-input"
          />
        </label>

        <p className="timezone-label">
          <Clock size={16} style={{ marginRight: "4px" }} /> Detected timezone:{" "}
          <b>{timezone}</b>
        </p>

        <button type="submit" disabled={loading || !dateTime}>
          {loading ? "Scheduling..." : "Schedule Interview"}
        </button>
      </form>

      {status && (
        <div className="status-msg">
          {status}
          {success && dateTime && (
            <>
              <div style={{ marginTop: "1rem" }}>
                <a
                  href={generateGoogleCalendarLink(dateTime)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="calendar-link"
                >
                  <CalendarPlus size={16} /> Add to Google Calendar
                </a>
              </div>
              <button
                className="calendar-link"
                style={{ marginTop: "1rem" }}
                onClick={() => navigate("/dashboard/my-interviews")}
              >
                <ArrowRight size={16} /> Go to My Interviews
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ScheduleInterview;
