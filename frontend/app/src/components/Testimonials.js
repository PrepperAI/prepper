// src/components/Testimonials.js
import React from "react";
import "./Testimonials.css";

const testimonials = [
  {
    name: "Tanya K.",
    title: "Product Manager at Google",
    quote:
      "Prepper helped me regain confidence before my PM interviews. It felt so real, I forgot it was AI!",
    avatar: "https://randomuser.me/api/portraits/women/65.jpg",
  },
  {
    name: "Musa D.",
    title: "Software Engineer at Meta",
    quote:
      "The technical mock interview was spot on — the AI challenged me with system design and follow-ups. Highly recommend it!",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
  },
  {
    name: "Aisha B.",
    title: "UX Designer at Airbnb",
    quote:
      "The feedback and realistic experience blew me away. It’s now a regular part of my prep routine!",
    avatar: "https://randomuser.me/api/portraits/women/48.jpg",
  },
];

const Testimonials = () => {
  return (
    <section className="testimonials-section">
      <h2 className="testimonial-title">What Professionals Say</h2>
      <div className="testimonial-cards">
        {testimonials.map((t, index) => (
          <div key={index} className="testimonial-card">
            <img src={t.avatar} alt={t.name} className="testimonial-avatar" />
            <p className="testimonial-quote">“{t.quote}”</p>
            <p className="testimonial-name">{t.name}</p>
            <p className="testimonial-role">{t.title}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Testimonials;
