import React, { useState, useEffect, useRef } from "react";
import styles from "./Dashboard.module.css";
import { useUser } from "../context/UserContext";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { getAuth, signOut } from "firebase/auth";
import UpgradeButton from "../components/UpgradeButton";
import { cancelSubscription } from "../utils/billing";
import CancelPlanModal from "../components/CancelPlanModal";
import toast from "react-hot-toast";
import {
  Home,
  Mic,
  Code,
  BrainCircuit,
  CalendarClock,
  Folder,
  MessageSquareText,
  LogOut,
  XCircle,
  Gem,
} from "lucide-react";

const Dashboard = () => {
  const { user } = useUser();
  const location = useLocation();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const menuRef = useRef();

  const isActive = (path) => (location.pathname === path ? styles.active : "");

  const handleSignOut = () => {
    const auth = getAuth();
    signOut(auth)
      .then(() => {
        console.log("✅ Signed out");
        navigate("/");
      })
      .catch((err) => toast.error("Sign out failed."));
  };

  const handleConfirmCancel = async () => {
    if (!user?.uid) return;
    try {
      const res = await cancelSubscription(user.uid);
      toast.success(
        res.message ||
          "Subscription cancelled. You'll remain premium until the billing period ends."
      );
    } catch (err) {
      toast.error(err.message || "Failed to cancel subscription.");
    } finally {
      setShowCancelModal(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={styles.dashboardPage}>
      <aside className={styles.sidebar}>
        <Link className={styles.logo} to="/">
          Prep<span>per</span>
        </Link>

        <nav className={styles.navLinks}>
          <Link to="/dashboard/home" className={isActive("/dashboard/home")}>
            <Home size={18} style={{ marginRight: 8 }} /> Dashboard
          </Link>
          <Link
            to="/dashboard/behavioral"
            className={isActive("/dashboard/behavioral")}
          >
            <Mic size={18} style={{ marginRight: 8 }} /> Behavioral Interview
          </Link>
          <Link
            to="/dashboard/technical"
            className={isActive("/dashboard/technical")}
          >
            <Code size={18} style={{ marginRight: 8 }} /> Technical Coding
          </Link>
          <Link
            to="/dashboard/system-design"
            className={isActive("/dashboard/system-design")}
          >
            <BrainCircuit size={18} style={{ marginRight: 8 }} /> System Design
          </Link>
          <Link
            to="/dashboard/schedule"
            className={isActive("/dashboard/schedule")}
          >
            <CalendarClock size={18} style={{ marginRight: 8 }} /> Schedule
            Interview
          </Link>
          <Link
            to="/dashboard/my-interviews"
            className={isActive("/dashboard/my-interviews")}
          >
            <Folder size={18} style={{ marginRight: 8 }} /> My Interviews
          </Link>
          <Link
            to="/dashboard/feedback"
            className={isActive("/dashboard/feedback")}
          >
            <MessageSquareText size={18} style={{ marginRight: 8 }} /> Feedback
          </Link>
        </nav>

        {!user?.isPremium && (
          <div className={styles.upgradeCard}>
            <h4>
              <Gem size={16} style={{ marginRight: 6 }} /> Upgrade to Premium
            </h4>
            <p>Unlock all features and access.</p>
            <UpgradeButton />
          </div>
        )}

        <div
          className={styles.userProfile}
          onClick={() => setShowMenu((prev) => !prev)}
          ref={menuRef}
        >
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt="User Avatar"
              className={styles.avatar}
            />
          ) : (
            <div className={styles.avatarPlaceholder}>
              {user?.name?.charAt(0)}
            </div>
          )}
          <p className={styles.userName}>{user?.name}</p>
          <p className={styles.planType}>
            {user?.isPremium ? (
              <>
                <Gem size={14} style={{ marginRight: 4 }} /> Premium Plan
              </>
            ) : (
              "🆓 Free Plan"
            )}
          </p>

          {showMenu && (
            <div className={styles.userMenu}>
              <button onClick={handleSignOut}>
                <LogOut size={16} style={{ marginRight: 6 }} /> Sign Out
              </button>
              <button onClick={() => setShowCancelModal(true)}>
                <XCircle size={16} style={{ marginRight: 6 }} /> Cancel Plan
              </button>
            </div>
          )}
        </div>
      </aside>

      <main className={styles.dashboardContainer}>
        <Outlet />
      </main>

      <CancelPlanModal
        open={showCancelModal}
        onConfirm={handleConfirmCancel}
        onCancel={() => setShowCancelModal(false)}
      />
    </div>
  );
};

export default Dashboard;
