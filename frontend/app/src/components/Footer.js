// src/components/Footer.js
import React from "react";
import "./Footer.css";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <h3 className="footer-logo">
          Prep<span>per</span>
        </h3>
        <p className="footer-tagline">
          Level up your interview prep. Built for professionals. Powered by AI.
        </p>

        <div className="footer-links">
          <a href="#features">Features</a>
          <a href="#pricing">Pricing</a>
          <a href="#schedule">Schedule</a>
          <a href="#testimonials">Testimonials</a>
          <a href="#contact">Contact</a>
        </div>

        <p className="footer-copy">
          &copy; {new Date().getFullYear()} Prepper. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
