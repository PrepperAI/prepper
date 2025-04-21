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
  Menu,
  X,
} from "lucide-react";

const Dashboard = () => {
  const { user } = useUser();
  const location = useLocation();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuRef = useRef();
  const sidebarRef = useRef();

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

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }

      if (
        window.innerWidth <= 768 &&
        sidebarRef.current &&
        !sidebarRef.current.contains(e.target) &&
        isMobileMenuOpen
      ) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMobileMenuOpen]);

  return (
    <div className={styles.dashboardPage}>
      <button
        className={styles.mobileMenuToggle}
        onClick={toggleMobileMenu}
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <aside
        ref={sidebarRef}
        className={`${styles.sidebar} ${
          isMobileMenuOpen ? styles.sidebarOpen : ""
        }`}
      >
        <Link className={styles.logo} to="/">
          <div className={styles.logoText}>
            Prep<span>per</span>
          </div>
          <div className={styles.logoIcon}>
            P<span>p</span>
          </div>
        </Link>

        <nav className={styles.navLinks}>
          <Link to="/dashboard/home" className={isActive("/dashboard/home")}>
            <Home size={18} />{" "}
            <span className={styles.linkText}>Dashboard</span>
          </Link>
          <Link
            to="/dashboard/behavioral"
            className={isActive("/dashboard/behavioral")}
          >
            <Mic size={18} />{" "}
            <span className={styles.linkText}>Behavioral Interview</span>
          </Link>
          <Link
            to="/dashboard/technical"
            className={isActive("/dashboard/technical")}
          >
            <Code size={18} />{" "}
            <span className={styles.linkText}>Technical Coding</span>
          </Link>
          <Link
            to="/dashboard/system-design"
            className={isActive("/dashboard/system-design")}
          >
            <BrainCircuit size={18} />{" "}
            <span className={styles.linkText}>System Design</span>
          </Link>
          <Link
            to="/dashboard/schedule"
            className={isActive("/dashboard/schedule")}
          >
            <CalendarClock size={18} />{" "}
            <span className={styles.linkText}>Schedule Interview</span>
          </Link>
          <Link
            to="/dashboard/my-interviews"
            className={isActive("/dashboard/my-interviews")}
          >
            <Folder size={18} />{" "}
            <span className={styles.linkText}>My Interviews</span>
          </Link>
          <Link
            to="/dashboard/feedback"
            className={isActive("/dashboard/feedback")}
          >
            <MessageSquareText size={18} />{" "}
            <span className={styles.linkText}>Feedback</span>
          </Link>
        </nav>

        {!user?.isPremium && (
          <div className={styles.upgradeCard}>
            <h4>
              <Gem size={16} />{" "}
              <span className={styles.upgradeText}>Upgrade to Premium</span>
            </h4>
            <p className={styles.upgradeDesc}>
              Unlock all features and access.
            </p>
            <UpgradeButton />
          </div>
        )}

        <div
          className={styles.userProfile}
          onClick={() => setShowMenu((prev) => !prev)}
          ref={menuRef}
        >
          <div
            className={styles.avatarPlaceholder}
            style={{
              backgroundColor: "#6366f1",
              border: "1px solid #fff",
              padding: "4px",
              boxSizing: "border-box",
            }}
          >
            {(user?.name && user.name.charAt(0).toUpperCase()) || "?"}
          </div>

          <div className={styles.userInfo}>
            <p className={styles.userName}>{user?.name || "Guest"}</p>

            <p className={styles.planType}>
              <Gem size={14} />{" "}
              <span className={styles.planText}>
                {user?.isPremium ? "Premium Plan" : "Free Plan"}
              </span>
            </p>
          </div>

          {showMenu && (
            <div className={styles.userMenu}>
              <button onClick={handleSignOut}>
                <LogOut size={16} /> <span>Sign Out</span>
              </button>
              <button onClick={() => setShowCancelModal(true)}>
                <XCircle size={16} /> <span>Cancel Plan</span>
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
