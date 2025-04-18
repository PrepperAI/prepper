// utils/interviewUtils.js
export const fetchInterviewResponse = async ({ message, config }) => {
  const response = await fetch("http://127.0.0.1:8000/api/interview", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      session_id: "session-123",
      message,
      role: config?.job_role || "Software Engineer",
      interview_type: config?.interview_type || "Behavioral",
      experience_level: config?.experience_level || "Entry",
      parsed_resume: "",
    }),
  });
  return await response.json();
};

export const buildInterviewConfig = (mode) => ({
  title: `${mode} - AI Interview`,
  interview_type: mode,
  job_role: mode.includes("Technical")
    ? "Software Engineer"
    : "Product Manager",
  experience_level: "Entry",
});
