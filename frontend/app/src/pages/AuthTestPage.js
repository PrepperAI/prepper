// src/pages/AuthTestPage.js
import React from "react";
import { useUser } from "../context/UserContext";
import Login from "./Login";
import LogoutButton from "./LogoutButton";

const AuthTestPage = () => {
  const { user } = useUser();

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>🔐 Auth Test Page</h1>

      {user ? (
        <>
          <p>
            ✅ Logged in as <strong>{user.name}</strong> ({user.email})
          </p>
          <img
            src={user.photoURL}
            alt="Profile"
            style={{ borderRadius: "50%", width: "80px", marginBottom: "1rem" }}
          />
          <LogoutButton />
        </>
      ) : (
        <>
          <p>⚠️ Not logged in</p>
          <Login />
        </>
      )}
    </div>
  );
};

export default AuthTestPage;
