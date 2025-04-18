import React from "react";
import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "../firebase";
import { useUser } from "../context/UserContext";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const { setUser } = useUser();
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      console.log("✅ Logged in:", user);

      const userData = {
        uid: user.uid,
        name: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
      };

      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));

      navigate("/dashboard/home");
    } catch (error) {
      console.error("❌ Login error", error);
      alert("Login failed. Please try again.");
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Sign in to Prepper</h2>
      <button onClick={handleLogin} style={styles.button}>
        <img
          src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
          alt="Google"
          style={styles.icon}
        />
        Sign in with Google
      </button>
    </div>
  );
};

const styles = {
  container: {
    height: "100vh",
    backgroundColor: "#0d0d0d", // dark background
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    color: "#ffffff",
  },
  heading: {
    fontSize: "32px",
    color: "#4FC3F7", // soft blue
    marginBottom: "30px",
    fontFamily: "'Orbitron', sans-serif",
  },
  button: {
    display: "flex",
    alignItems: "center",
    padding: "12px 20px",
    fontSize: "16px",
    cursor: "pointer",
    borderRadius: "8px",
    border: "none",
    background: "#ffffff",
    color: "#000000",
    fontWeight: "bold",
    boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
  },
  icon: {
    width: "24px",
    height: "24px",
    marginRight: "12px",
  },
};

export default Login;
