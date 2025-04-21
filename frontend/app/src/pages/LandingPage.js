// File: src/pages/LandingPage.js
import React from "react";
import Header from "../components/Header";
import Hero from "../components/Hero";
import Features from "../components/Features";
import ToolsGrid from "../components/ToolsGrid";
import Pricing from "../components/Pricing";
import ScheduleSection from "../components/ScheduleSection";
import Footer from "../components/Footer";
import Testimonials from "../components/Testimonials";
import "./LandingPage.css";

const LandingPage = () => {
  return (
    <>
      <Header /> {/* Fixed position */}
      {/* Content starts below the header */}
      <div className="page-content">
        <Hero />

        <div id="features">
          <Features />
        </div>

        {/* <div id="tools">
          <ToolsGrid />
        </div> */}

        <div id="pricing">
          <Pricing />
        </div>

        <div id="schedule">
          <ScheduleSection />
        </div>

        <div id="testimonials">
          <Testimonials />
        </div>

        <Footer />
      </div>
    </>
  );
};

export default LandingPage;
