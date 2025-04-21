import React, { useState, useEffect } from "react";
import "./Header.css";
import { useNavigate, useLocation } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { Menu, X } from "lucide-react";

const Header = () => {
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
      setCheckingAuth(false);
    });

    // Prevent scrolling when menu is open
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      unsubscribe();
      document.body.style.overflow = "unset";
    };
  }, [menuOpen]);

  useEffect(() => {
    // Check if there's a hash in the URL when the component mounts or location changes
    if (location.hash) {
      const id = location.hash.replace("#", "");
      const element = document.getElementById(id);
      if (element) {
        // Wait a bit for the page to fully load before scrolling
        setTimeout(() => {
          const yOffset = -80; // Adjust based on header height
          const y =
            element.getBoundingClientRect().top + window.pageYOffset + yOffset;
          window.scrollTo({ top: y, behavior: "smooth" });
        }, 100);
      }
    }
  }, [location]);

  const handleGetStarted = () => {
    if (isLoggedIn) {
      navigate("/dashboard/home");
    } else {
      navigate("/login");
    }
    setMenuOpen(false);
  };

  const handleLogoClick = () => {
    if (isLoggedIn) {
      navigate("/dashboard/home");
    } else {
      navigate("/");
    }
    setMenuOpen(false);
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      closeMenu();

      // If we're not on the homepage, navigate there first
      if (location.pathname !== "/") {
        navigate("/");
        // We'll need to wait for the navigation to complete before scrolling
        setTimeout(() => {
          const yOffset = -80; // Adjust based on header height
          const y =
            element.getBoundingClientRect().top + window.pageYOffset + yOffset;
          window.scrollTo({ top: y, behavior: "smooth" });
        }, 100);
      } else {
        // We're already on the homepage, just scroll
        const yOffset = -80; // Adjust based on header height
        const y =
          element.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: "smooth" });
      }
    }
  };

  return (
    <>
      <div
        className={`menu-overlay ${menuOpen ? "active" : ""}`}
        onClick={closeMenu}
      ></div>
      <header className="main-header">
        <div className="logo" onClick={handleLogoClick}>
          Prep<span className="accent">per</span>
        </div>

        <div
          className={`nav-toggle ${menuOpen ? "open" : ""}`}
          onClick={toggleMenu}
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </div>

        <nav className={`nav-links ${menuOpen ? "show" : ""}`}>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection("features");
            }}
          >
            Features
          </a>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection("pricing");
            }}
          >
            Pricing
          </a>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection("schedule");
            }}
          >
            Schedule
          </a>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection("testimonials");
            }}
          >
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
    </>
  );
};

export default Header;

// import React, { useState, useEffect } from "react";
// import "./Header.css";
// import { useNavigate } from "react-router-dom";
// import { getAuth, onAuthStateChanged } from "firebase/auth";
// import { Menu, X } from "lucide-react"; // optional: use any icon library

// const Header = () => {
//   const [checkingAuth, setCheckingAuth] = useState(true);
//   const [isLoggedIn, setIsLoggedIn] = useState(false);
//   const [menuOpen, setMenuOpen] = useState(false);
//   const navigate = useNavigate();

//   useEffect(() => {
//     const auth = getAuth();
//     const unsubscribe = onAuthStateChanged(auth, (user) => {
//       setIsLoggedIn(!!user);
//       setCheckingAuth(false);
//     });

//     // Prevent scrolling when menu is open
//     if (menuOpen) {
//       document.body.style.overflow = "hidden";
//     } else {
//       document.body.style.overflow = "unset";
//     }

//     return () => {
//       unsubscribe();
//       document.body.style.overflow = "unset";
//     };
//   }, [menuOpen]);

//   const handleGetStarted = () => {
//     if (isLoggedIn) {
//       navigate("/dashboard/home");
//     } else {
//       navigate("/login");
//     }
//     setMenuOpen(false);
//   };

//   const handleLogoClick = () => {
//     if (isLoggedIn) {
//       navigate("/dashboard/home");
//     } else {
//       navigate("/");
//     }
//     setMenuOpen(false);
//   };

//   const toggleMenu = () => {
//     setMenuOpen(!menuOpen);
//   };

//   const closeMenu = () => {
//     setMenuOpen(false);
//   };

//   return (
//     <>
//       <div
//         className={`menu-overlay ${menuOpen ? "active" : ""}`}
//         onClick={closeMenu}
//       ></div>
//       <header className="main-header">
//         <div className="logo" onClick={handleLogoClick}>
//           Prep<span className="accent">per</span>
//         </div>

//         <div
//           className={`nav-toggle ${menuOpen ? "open" : ""}`}
//           onClick={toggleMenu}
//         >
//           {menuOpen ? <X size={24} /> : <Menu size={24} />}
//         </div>

//         <nav className={`nav-links ${menuOpen ? "show" : ""}`}>
//           <a href="#features" onClick={closeMenu}>
//             Features
//           </a>
//           <a href="#pricing" onClick={closeMenu}>
//             Pricing
//           </a>
//           <a href="#schedule" onClick={closeMenu}>
//             Schedule
//           </a>
//           <a href="#testimonials" onClick={closeMenu}>
//             Testimonials
//           </a>
//           <button
//             className="get-started"
//             onClick={handleGetStarted}
//             disabled={checkingAuth}
//           >
//             Get Started
//           </button>
//         </nav>
//       </header>
//     </>
//   );
// };

// export default Header;
