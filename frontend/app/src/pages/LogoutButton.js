import React from "react";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { useUser } from "../context/UserContext";
import { useNavigate } from "react-router-dom";

const LogoutButton = () => {
  const { setUser } = useUser();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);

      // Clear global state
      setUser(null);

      // Clear localStorage
      localStorage.removeItem("user");

      // Redirect
      navigate("/login");
    } catch (error) {
      console.error("❌ Logout error", error);
    }
  };

  return (
    <button onClick={handleLogout} style={styles.button}>
      🚪 Sign out
    </button>
  );
};

const styles = {
  button: {
    padding: "8px 14px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    background: "#f44336",
    color: "#fff",
    fontSize: "14px",
    cursor: "pointer",
    marginTop: "20px",
  },
};

export default LogoutButton;
