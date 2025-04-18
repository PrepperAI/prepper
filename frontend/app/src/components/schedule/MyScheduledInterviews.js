import React, { useEffect, useState } from "react";
import { useUser } from "../../context/UserContext";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { CalendarDays, Pencil, XCircle } from "lucide-react";
import "./MyScheduledInterview.module.css";

const MyScheduledInterviews = () => {
  const { user } = useUser();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [newDateTime, setNewDateTime] = useState(null);

  useEffect(() => {
    const fetchSessions = async () => {
      if (!user) return;
      try {
        const res = await fetch(
          `http://localhost:8000/api/schedule/list?user_id=${user.uid}`
        );
        const data = await res.json();
        setSessions(data.sessions || []);
      } catch (err) {
        console.error("❌ Failed to fetch schedules", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, [user]);

  const handleCancel = async (session_id) => {
    try {
      const res = await fetch(
        `http://localhost:8000/api/schedule/${user.uid}/${session_id}`,
        {
          method: "DELETE",
        }
      );
      if (res.ok) {
        setSessions(sessions.filter((s) => s.session_id !== session_id));
      }
    } catch (err) {
      console.error("❌ Failed to cancel", err);
    }
  };

  const handleReschedule = async () => {
    if (!editing || !newDateTime) return;

    const date = newDateTime.toISOString().split("T")[0];
    const time = newDateTime.toTimeString().split(" ")[0].slice(0, 5);

    try {
      const res = await fetch(
        `http://localhost:8000/api/schedule/${user.uid}/${editing.session_id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date, time }),
        }
      );
      if (res.ok) {
        const updated = sessions.map((s) =>
          s.session_id === editing.session_id ? { ...s, date, time } : s
        );
        setSessions(updated);
        setEditing(null);
        setNewDateTime(null);
      }
    } catch (err) {
      console.error("❌ Failed to reschedule", err);
    }
  };

  if (loading) {
    return (
      <div className="schedule-container">
        <p className="loading-state">Loading scheduled interviews...</p>
      </div>
    );
  }

  return (
    <div className="schedule-container">
      <h2>
        <CalendarDays size={20} style={{ marginRight: "8px" }} />
        Your Scheduled Interviews
      </h2>

      {sessions.length === 0 ? (
        <div className="empty-state">
          <p>No interviews scheduled yet.</p>
        </div>
      ) : (
        <table className="schedule-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Role</th>
              <th>Level</th>
              <th>Date</th>
              <th>Time</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((s) => (
              <tr key={s.session_id}>
                <td>{s.type}</td>
                <td>{s.role || "-"}</td>
                <td>{s.level || "-"}</td>
                <td>{s.date}</td>
                <td>{s.time}</td>
                <td>
                  <button onClick={() => setEditing(s)} title="Edit">
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => handleCancel(s.session_id)}
                    title="Delete"
                  >
                    <XCircle size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {editing && (
        <div className="reschedule-modal">
          <div className="modalContent">
            <h3>Reschedule Interview</h3>
            <DatePicker
              selected={newDateTime}
              onChange={setNewDateTime}
              showTimeSelect
              timeIntervals={15}
              dateFormat="yyyy-MM-dd HH:mm"
              minDate={new Date()}
              placeholderText="Select new date and time"
              className="datePicker"
            />
            <div className="modalActions">
              <button onClick={() => setEditing(null)}>Cancel</button>
              <button onClick={handleReschedule} disabled={!newDateTime}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyScheduledInterviews;
