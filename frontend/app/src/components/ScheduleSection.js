// // src/components/ScheduleSection.js
// import React, { useState } from "react";
// import "./ScheduleSection.css";

// const ScheduleSection = () => {
//   const [formData, setFormData] = useState({
//     name: "",
//     email: "",
//     role: "Software Engineer",
//     date: "",
//     time: "",
//   });

//   const handleChange = (e) => {
//     setFormData((prev) => ({
//       ...prev,
//       [e.target.name]: e.target.value,
//     }));
//   };

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     console.log("📅 Booking interview:", formData);
//     alert("Interview scheduled successfully! ✅");
//     setFormData({
//       name: "",
//       email: "",
//       role: "Software Engineer",
//       date: "",
//       time: "",
//     });
//   };

//   return (
//     <section className="schedule-section">
//       <h2 className="section-title">Schedule an Interview</h2>
//       <p className="section-subtext">
//         Book a live AI interview session at your preferred time.
//       </p>
//       <form className="schedule-form" onSubmit={handleSubmit}>
//         <input
//           type="text"
//           name="name"
//           placeholder="Full Name"
//           value={formData.name}
//           onChange={handleChange}
//           required
//         />
//         <input
//           type="email"
//           name="email"
//           placeholder="Email Address"
//           value={formData.email}
//           onChange={handleChange}
//           required
//         />
//         <select name="role" value={formData.role} onChange={handleChange}>
//           <option>Software Engineer</option>
//           <option>Data Scientist</option>
//           <option>Product Manager</option>
//           <option>Designer</option>
//           <option>Consultant</option>
//         </select>
//         <input
//           type="date"
//           name="date"
//           value={formData.date}
//           onChange={handleChange}
//           required
//         />
//         <input
//           type="time"
//           name="time"
//           value={formData.time}
//           onChange={handleChange}
//           required
//         />
//         <button type="submit">Book Interview</button>
//       </form>
//     </section>
//   );
// };

// export default ScheduleSection;
import React, { useState } from "react";
import "./ScheduleSection.css";

const ScheduleSection = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
    subject: "General Inquiry",
  });

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("📬 Contact form submitted:", formData);
    alert("Thanks for reaching out! We'll get back to you shortly. ✅");

    // Reset form
    setFormData({
      name: "",
      email: "",
      message: "",
      subject: "General Inquiry",
    });
  };

  return (
    <section className="schedule-section">
      <h2 className="section-title">Contact Us</h2>
      <p className="section-subtext">
        Got questions or feedback? We'd love to hear from you.
      </p>
      <form className="schedule-form" onSubmit={handleSubmit}>
        <input
          type="text"
          name="name"
          placeholder="Full Name"
          value={formData.name}
          onChange={handleChange}
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Email Address"
          value={formData.email}
          onChange={handleChange}
          required
        />
        <select name="subject" value={formData.subject} onChange={handleChange}>
          <option>General Inquiry</option>
          <option>Technical Support</option>
          <option>Partnership Opportunity</option>
          <option>Feature Request</option>
        </select>
        <textarea
          name="message"
          placeholder="Your Message"
          value={formData.message}
          onChange={handleChange}
          rows={4}
          required
        />
        <button type="submit">Send Message</button>
      </form>
    </section>
  );
};

export default ScheduleSection;
