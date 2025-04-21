// // src/components/Header.js
// import React, { useState, useEffect } from "react";
// import "./Header.css";
// import { useNavigate } from "react-router-dom";
// import { getAuth, onAuthStateChanged } from "firebase/auth";

// const Header = () => {
//   const [checkingAuth, setCheckingAuth] = useState(true);
//   const [isLoggedIn, setIsLoggedIn] = useState(false);
//   const navigate = useNavigate();

//   useEffect(() => {
//     const auth = getAuth();
//     const unsubscribe = onAuthStateChanged(auth, (user) => {
//       setIsLoggedIn(!!user);
//       setCheckingAuth(false);
//     });

//     return () => unsubscribe();
//   }, []);

//   const handleGetStarted = () => {
//     if (isLoggedIn) {
//       navigate("/dashboard/home");
//     } else {
//       navigate("/login");
//     }
//   };

//   const handleLogoClick = () => {
//     if (isLoggedIn) {
//       navigate("/dashboard/home");
//     } else {
//       navigate("/");
//     }
//   };

//   return (
//     <header className="main-header">
//       <div
//         className="logo"
//         onClick={handleLogoClick}
//         style={{ cursor: "pointer" }}
//       >
//         Prep<span className="accent">per</span>
//       </div>

//       <nav className="nav-links">
//         <nav className="navbar-links">
//           <a href="#features">Features</a>
//           {/* <a href="#tools">Tools</a> */}
//           <a href="#pricing">Pricing</a>
//           <a href="#schedule">Schedule</a>
//           <a href="#testimonials">Testimonials</a>
//         </nav>
//       </nav>

//       <div className="cta-button">
//         <button onClick={handleGetStarted} disabled={checkingAuth}>
//           Get Started
//         </button>
//       </div>
//     </header>
//   );
// };

// export default Header;

import React, { useState, useEffect } from "react";
import "./Header.css";
import { useNavigate } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { Menu, X } from "lucide-react"; // optional: use any icon library

const Header = () => {
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
      setCheckingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  const handleGetStarted = () => {
    if (isLoggedIn) {
      navigate("/dashboard/home");
    } else {
      navigate("/login");
    }
  };

  const handleLogoClick = () => {
    if (isLoggedIn) {
      navigate("/dashboard/home");
    } else {
      navigate("/");
    }
  };

  return (
    <header className="main-header">
      <div className="logo" onClick={handleLogoClick}>
        Prep<span className="accent">per</span>
      </div>

      <div
        className={`nav-toggle ${menuOpen ? "open" : ""}`}
        onClick={() => setMenuOpen(!menuOpen)}
      >
        {menuOpen ? <X size={24} /> : <Menu size={24} />}
      </div>

      <nav className={`nav-links ${menuOpen ? "show" : ""}`}>
        <a href="#features" onClick={() => setMenuOpen(false)}>
          Features
        </a>
        <a href="#pricing" onClick={() => setMenuOpen(false)}>
          Pricing
        </a>
        <a href="#schedule" onClick={() => setMenuOpen(false)}>
          Schedule
        </a>
        <a href="#testimonials" onClick={() => setMenuOpen(false)}>
          Testimonials
        </a>
        <button
          className="get-started"
          onClick={handleGetStarted}
          disabled={checkingAuth}
        >
          Get Started
        </button>
      </nav>
    </header>
  );
};

export default Header;
