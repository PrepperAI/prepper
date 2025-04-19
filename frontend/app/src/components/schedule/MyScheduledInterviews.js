// import React, { useEffect, useState } from "react";
// import { useUser } from "../../context/UserContext";
// import {
//   CalendarDays,
//   Pencil,
//   XCircle,
//   X,
//   Calendar,
//   Clock,
// } from "lucide-react";
// import styles from "./MyScheduledInterview.module.css";
// import { API_BASE_URL } from "../../utils/api";

// const MyScheduledInterviews = () => {
//   const { user } = useUser();
//   const [sessions, setSessions] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [editing, setEditing] = useState(null);
//   const [newDateTime, setNewDateTime] = useState(null);
//   const [dateValue, setDateValue] = useState("");
//   const [timeValue, setTimeValue] = useState("");

//   useEffect(() => {
//     const fetchSessions = async () => {
//       if (!user) return;
//       try {
//         const res = await fetch(
//           `${API_BASE_URL}/api/schedule/list?user_id=${user.uid}`
//         );
//         const data = await res.json();
//         setSessions(data.sessions || []);
//       } catch (err) {
//         console.error("❌ Failed to fetch schedules", err);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchSessions();
//   }, [user]);

//   // Set initial date and time values when editing a session
//   useEffect(() => {
//     if (editing) {
//       setDateValue(editing.date);
//       setTimeValue(editing.time);
//       setNewDateTime(new Date(`${editing.date}T${editing.time}`));
//     } else {
//       setDateValue("");
//       setTimeValue("");
//       setNewDateTime(null);
//     }
//   }, [editing]);

//   const handleDateChange = (e) => {
//     setDateValue(e.target.value);
//     updateDateTime(e.target.value, timeValue);
//   };

//   const handleTimeChange = (e) => {
//     setTimeValue(e.target.value);
//     updateDateTime(dateValue, e.target.value);
//   };

//   const updateDateTime = (date, time) => {
//     if (date && time) {
//       const dateTime = new Date(`${date}T${time}`);
//       setNewDateTime(dateTime);
//     } else {
//       setNewDateTime(null);
//     }
//   };

//   const handleCancel = async (session_id) => {
//     try {
//       const res = await fetch(
//         `${API_BASE_URL}/api/schedule/${user.uid}/${session_id}`,
//         {
//           method: "DELETE",
//         }
//       );
//       if (res.ok) {
//         setSessions(sessions.filter((s) => s.session_id !== session_id));
//       }
//     } catch (err) {
//       console.error("❌ Failed to cancel", err);
//     }
//   };

//   const handleReschedule = async () => {
//     if (!editing || !newDateTime) return;

//     const date = newDateTime.toISOString().split("T")[0];
//     const time = newDateTime.toTimeString().split(" ")[0].slice(0, 5);

//     try {
//       const res = await fetch(
//         `${API_BASE_URL}/api/schedule/${user.uid}/${editing.session_id}`,
//         {
//           method: "PATCH",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({ date, time }),
//         }
//       );
//       if (res.ok) {
//         const updated = sessions.map((s) =>
//           s.session_id === editing.session_id ? { ...s, date, time } : s
//         );
//         setSessions(updated);
//         setEditing(null);
//         setNewDateTime(null);
//       }
//     } catch (err) {
//       console.error("❌ Failed to reschedule", err);
//     }
//   };

//   if (loading) {
//     return (
//       <div className={styles.scheduleContainer}>
//         <p className={styles.loadingState}>Loading scheduled interviews...</p>
//       </div>
//     );
//   }

//   return (
//     <div className={styles.scheduleContainer}>
//       <h2>
//         <CalendarDays size={20} style={{ marginRight: "8px" }} />
//         Your Scheduled Interviews
//       </h2>

//       {sessions.length === 0 ? (
//         <div className={styles.emptyState}>
//           <p>No interviews scheduled yet.</p>
//         </div>
//       ) : (
//         <table className={styles.scheduleTable}>
//           <thead>
//             <tr>
//               <th>Type</th>
//               <th>Role</th>
//               <th>Level</th>
//               <th>Date</th>
//               <th>Time</th>
//               <th>Actions</th>
//             </tr>
//           </thead>
//           <tbody>
//             {sessions.map((s) => (
//               <tr key={s.session_id}>
//                 <td data-label="Type">{s.type}</td>
//                 <td data-label="Role">{s.role || "-"}</td>
//                 <td data-label="Level">{s.level || "-"}</td>
//                 <td data-label="Date">{s.date}</td>
//                 <td data-label="Time">{s.time}</td>
//                 <td data-label="Actions">
//                   <button
//                     className={styles.iconButton}
//                     onClick={() => setEditing(s)}
//                     title="Edit"
//                   >
//                     <Pencil size={16} />
//                   </button>
//                   <button
//                     className={styles.iconButton}
//                     onClick={() => handleCancel(s.session_id)}
//                     title="Delete"
//                   >
//                     <XCircle size={16} />
//                   </button>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       )}

//       {editing && (
//         <div className={styles.rescheduleModal}>
//           <div className={styles.modalContent}>
//             <h3 className={styles.modalTitle}>Reschedule Interview</h3>
//             <button
//               className={styles.closeBtn}
//               onClick={() => setEditing(null)}
//               title="Close"
//             >
//               <X size={18} />
//             </button>

//             <div className={styles.dateTimeContainer}>
//               <div className={styles.inputGroup}>
//                 <label htmlFor="date-input" className={styles.inputLabel}>
//                   Date
//                 </label>
//                 <div className={styles.inputWrapper}>
//                   <Calendar size={18} className={styles.inputIcon} />
//                   <input
//                     id="date-input"
//                     type="date"
//                     value={dateValue}
//                     onChange={handleDateChange}
//                     className={styles.dateInput}
//                     min={new Date().toISOString().split("T")[0]}
//                   />
//                 </div>
//               </div>

//               <div className={styles.inputGroup}>
//                 <label htmlFor="time-input" className={styles.inputLabel}>
//                   Time
//                 </label>
//                 <div className={styles.inputWrapper}>
//                   <Clock size={18} className={styles.inputIcon} />
//                   <input
//                     id="time-input"
//                     type="time"
//                     value={timeValue}
//                     onChange={handleTimeChange}
//                     className={styles.timeInput}
//                     step="900" // 15-minute intervals (15 * 60 seconds)
//                   />
//                 </div>
//               </div>
//             </div>

//             <div className={styles.modalActions}>
//               <button onClick={() => setEditing(null)}>Cancel</button>
//               <button onClick={handleReschedule} disabled={!newDateTime}>
//                 Confirm
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default MyScheduledInterviews;

import React, { useEffect, useState } from "react";
import { useUser } from "../../context/UserContext";
import { CalendarDays, Pencil, XCircle, X, Calendar } from "lucide-react";
import styles from "./MyScheduledInterview.module.css";
import { API_BASE_URL } from "../../utils/api";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

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
          `${API_BASE_URL}/api/schedule/list?user_id=${user.uid}`
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

  useEffect(() => {
    if (editing) {
      setNewDateTime(new Date(`${editing.date}T${editing.time}`));
    } else {
      setNewDateTime(null);
    }
  }, [editing]);

  const handleCancel = async (session_id) => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/schedule/${user.uid}/${session_id}`,
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
        `${API_BASE_URL}/api/schedule/${user.uid}/${editing.session_id}`,
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
      <div className={styles.scheduleContainer}>
        <p className={styles.loadingState}>Loading scheduled interviews...</p>
      </div>
    );
  }

  return (
    <div className={styles.scheduleContainer}>
      <h2>
        <CalendarDays size={20} style={{ marginRight: "8px" }} />
        Your Scheduled Interviews
      </h2>

      {sessions.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No interviews scheduled yet.</p>
        </div>
      ) : (
        <table className={styles.scheduleTable}>
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
                <td data-label="Type">{s.type}</td>
                <td data-label="Role">{s.role || "-"}</td>
                <td data-label="Level">{s.level || "-"}</td>
                <td data-label="Date">{s.date}</td>
                <td data-label="Time">{s.time}</td>
                <td data-label="Actions">
                  <button
                    className={styles.iconButton}
                    onClick={() => setEditing(s)}
                    title="Edit"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    className={styles.iconButton}
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
        <div className={styles.rescheduleModal}>
          <div className={styles.modalContent}>
            <h3 className={styles.modalTitle}>Reschedule Interview</h3>
            <button
              className={styles.closeBtn}
              onClick={() => setEditing(null)}
              title="Close"
            >
              <X size={18} />
            </button>

            <div className={styles.inputGroup}>
              <label htmlFor="datetime-picker" className={styles.inputLabel}>
                New Date & Time
              </label>

              <div className={styles.inputWrapper}>
                <Calendar size={18} className={styles.inputIcon} />
                <DatePicker
                  id="datetime-picker"
                  selected={newDateTime}
                  onChange={(date) => setNewDateTime(date)}
                  showTimeSelect
                  timeIntervals={15}
                  dateFormat="Pp"
                  minDate={new Date()}
                  placeholderText="Select new date and time"
                  className={styles.dateInput}
                />
              </div>
            </div>

            <div className={styles.modalActions}>
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
