import React, { useState, useEffect } from "react";
import styles from "./DashboardHome.module.css";
import { useUser } from "../context/UserContext";
import { useNavigate } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { Timestamp } from "firebase/firestore";
import ResumeManager from "../components/ResumeManager";
import {
  CheckCircle,
  Calendar,
  Flame,
  Star,
  Mic,
  Code2,
  Brain,
  CalendarClock,
  HandMetal,
  Hourglass,
} from "lucide-react";

const DashboardHome = () => {
  const { user } = useUser();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalSessions: 0,
    streak: 0,
    premium: "Free Plan",
  });
  const [upcomingCount, setUpcomingCount] = useState(0);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;

      const upcomingRef = collection(
        db,
        "scheduled_interviews",
        user.uid,
        "sessions"
      );
      const upcomingSnap = await getDocs(upcomingRef);
      const now = new Date();

      const upcoming = [];

      upcomingSnap.forEach((doc) => {
        const data = doc.data();
        const interviewDate = new Date(`${data.date}T${data.time}`);
        if (interviewDate > now) {
          upcoming.push(data);
        }
      });
      setUpcomingCount(upcoming.length);

      const sessionTypes = [
        "behavioral_sessions",
        "technical_sessions",
        "system_design_sessions",
      ];

      const timestamps = [];

      for (const type of sessionTypes) {
        try {
          const sessionRef = collection(db, type, user.uid, "sessions");
          const snapshot = await getDocs(sessionRef);

          snapshot.forEach((doc) => {
            const data = doc.data();
            const createdAt = data.created_at || data.timestamp;
            if (createdAt instanceof Timestamp) {
              timestamps.push(createdAt.toDate());
            }
          });
        } catch (err) {
          console.error(`❌ Error fetching ${type} for user ${user.uid}:`, err);
        }
      }

      timestamps.sort((a, b) => b - a);

      let streak = 0;
      const today = new Date();

      for (let i = 0; i < timestamps.length; i++) {
        const expectedDate = new Date(today);
        expectedDate.setDate(today.getDate() - streak);

        if (timestamps[i].toDateString() === expectedDate.toDateString()) {
          streak++;
        } else {
          break;
        }
      }

      setStats({
        totalSessions: timestamps.length,
        streak,
        premium: "Free Plan",
      });
    };

    fetchStats();
  }, [user]);

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>
        Welcome back, {user?.name?.split(" ")[0]}{" "}
        <HandMetal size={22} style={{ verticalAlign: "middle" }} />
      </h1>
      <p className={styles.subtitle}>
        Here's a quick overview of your activity.
      </p>

      <div className={styles.grid}>
        <div className={styles.card}>
          <h3>
            <CheckCircle size={18} /> Interviews Practiced
          </h3>
          <p className={styles.stat}>{stats.totalSessions}</p>
        </div>
        <div className={styles.card}>
          <h3>
            <Calendar size={18} /> Scheduled Interviews
          </h3>
          <p className={styles.stat}>{upcomingCount}</p>
        </div>
        <div className={styles.card}>
          <h3>
            <Flame size={18} /> Streak
          </h3>
          <p className={styles.stat}>{stats.streak} days</p>
        </div>
        <div className={styles.card}>
          <h3>
            <Star size={18} /> Premium Status
          </h3>
          <p className={styles.stat}>
            {user?.isPremium ? "Premium Plan" : "Free Plan"}
          </p>
        </div>
      </div>

      {!user?.isPremium && (
        <div className={styles.remainingAttempts}>
          <h2>
            <Hourglass
              size={18}
              style={{ marginRight: "6px", verticalAlign: "middle" }}
            />
            Remaining Practice Attempts
          </h2>
          <ul className={styles.attemptList}>
            <li>
              <Mic
                size={14}
                style={{ marginRight: "6px", verticalAlign: "middle" }}
              />
              Behavioral: {user?.remainingAttempts?.behavioral ?? 0}
            </li>
            <li>
              <Code2
                size={14}
                style={{ marginRight: "6px", verticalAlign: "middle" }}
              />
              Technical: {user?.remainingAttempts?.technical ?? 0}
            </li>
            <li>
              <Brain
                size={14}
                style={{ marginRight: "6px", verticalAlign: "middle" }}
              />
              System Design: {user?.remainingAttempts?.systemDesign ?? 0}
            </li>
          </ul>
        </div>
      )}

      <div className={styles.quickActions}>
        <h2>Quick Start</h2>
        <div className={styles.buttons}>
          <button
            className={styles.action}
            onClick={() => navigate("/dashboard/behavioral")}
          >
            <Mic size={16} /> Behavioral
          </button>
          <button
            className={styles.action}
            onClick={() => navigate("/dashboard/technical")}
          >
            <Code2 size={16} /> Coding
          </button>
          <button
            className={styles.action}
            onClick={() => navigate("/dashboard/system-design")}
          >
            <Brain size={16} /> System Design
          </button>
          <button
            className={styles.action}
            onClick={() => navigate("/dashboard/schedule")}
          >
            <CalendarClock size={16} /> Schedule
          </button>
        </div>
      </div>

      <ResumeManager />
    </div>
  );
};

export default DashboardHome;
