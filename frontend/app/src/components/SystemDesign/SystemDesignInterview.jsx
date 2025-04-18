import React, { useEffect, useRef, useState } from "react";
import SystemDesignCanvas from "./SystemDesignCanvas";
import LiveTranscriber from "../LiveTranscriber";
import UserCameraPreview from "../UserCameraPreview";
import { useUser } from "../../context/UserContext";
import styles from "./SystemDesignInterview.module.css";
import BlockedModal from "../BlockedModal";
import Clock from "../clock/Clock";
import HeyGenAvatarStreamer from "../HeyGenAvatarStreamer";
import { useNavigate } from "react-router-dom";
import { generateFeedback } from "../../utils/getFeedback";
import TranscriptView from "../interview-modes/TranscriptView";
// Loading overlay component
const LoadingOverlay = ({
  message = "Preparing your system design interview...",
}) => {
  return (
    <div className={styles.loadingOverlay}>
      <div className={styles.loader}></div>
      <p>{message}</p>
      <p className={styles.loadingSubtext}>This may take a few seconds</p>
    </div>
  );
};

const SystemDesignInterview = ({ config }) => {
  const [question, setQuestion] = useState("");
  const [aiFeedback, setAiFeedback] = useState("");
  const [transcript, setTranscript] = useState("");
  const [conversationLog, setConversationLog] = useState([]);
  const avatarRef = useRef(null);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const finalTranscriptBuffer = useRef("");
  const finalDebounceTimeout = useRef(null);
  const [isLoading, setIsLoading] = useState(true);

  const sessionId = useRef(crypto.randomUUID());
  const canvasRef = useRef(null);
  const hasInitializedRef = useRef(false);
  const { user } = useUser();
  const [blocked, setBlocked] = useState(false);
  const [checkedAttempts, setCheckedAttempts] = useState(false);
  const navigate = useNavigate();
  const [permissionsGranted, setPermissionsGranted] = useState(null);
  const [loadingUserInfo, setLoadingUserInfo] = useState(true);

  useEffect(() => {
    const getPermissions = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      try {
        stream.getTracks().forEach((track) => track.stop());
        setPermissionsGranted(true);
      } catch (e) {
        console.error("❌ Error stopping tracks", e);
      }
    };

    getPermissions().catch((err) => {
      console.error("🎤 Permission denied:", err);
      setPermissionsGranted(false);
    });
  }, []);

  useEffect(() => {
    if (!user) return;

    const attempts = user.remainingAttempts;

    // Wait for remainingAttempts to be defined
    if (!attempts || typeof attempts.systemDesign !== "number") return;

    if (!user.isPremium && attempts.technical <= 0) {
      console.log("🚫 Blocking access to technical interview");
      setBlocked(true);
    }

    // ✅ We're now sure everything is loaded
    setLoadingUserInfo(false);
  }, [user]);

  // Helper function for sending the initial greeting with retries
  const sendInitialGreeting = async (message, maxAttempts = 3) => {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      console.log(`🟣 Attempt ${attempt} to send initial greeting`);
      try {
        if (avatarRef.current?.speak) {
          setAiSpeaking(true);
          await avatarRef.current.speak(message);
          setAiSpeaking(false);
          console.log("✅ Initial greeting sent successfully");
          return true;
        } else {
          console.warn(
            `❓ Avatar speak method not available on attempt ${attempt}`
          );
          // Short wait before next check if method isn't available yet
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      } catch (err) {
        console.warn(`❌ Attempt ${attempt} failed:`, err);
      }

      if (attempt < maxAttempts) {
        // Exponential backoff for retries
        const waitTime = 1000 * Math.pow(1.5, attempt - 1);
        console.log(`⏳ Waiting ${waitTime}ms before retry ${attempt + 1}...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }
    console.error("❌ Failed to send initial greeting after all attempts");

    // Add fallback to conversation log even if the avatar couldn't speak
    setConversationLog((prev) => [
      ...prev,
      { role: "ai", content: message, note: "(Avatar may not have spoken)" },
    ]);

    return false;
  };

  // Wait for avatar to be ready
  const waitForAvatarReady = async (maxWait = 5000) => {
    const interval = 100;
    let waited = 0;
    while (
      (!avatarRef.current || !avatarRef.current.isReady?.()) &&
      waited < maxWait
    ) {
      await new Promise((res) => setTimeout(res, interval));
      waited += interval;
    }
    return avatarRef.current?.isReady?.();
  };

  const getCanvasImage = () => {
    if (!canvasRef.current) return null;
    return canvasRef.current.getSceneElements
      ? canvasRef.current.getSceneElements()
      : null;
  };

  const handleFinalTranscript = async (spokenTranscript) => {
    if (!spokenTranscript || spokenTranscript.length < 2) return;

    const canvasData = getCanvasImage();

    try {
      // Add user message to conversation log immediately
      setConversationLog((prev) => [
        ...prev,
        { role: "user", content: spokenTranscript },
      ]);

      setTranscript(spokenTranscript);

      const res = await fetch(
        "http://localhost:8000/api/interview/system-design",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_id: sessionId.current,
            spoken_response: spokenTranscript,
            canvas_data: canvasData || [],
            interview_type: config?.interview_type || "system design",
            job_role: config?.job_role || "Backend Engineer",
            candidate_level: config?.experience_level || "Mid level",
            resume: config?.resume || "No resume provided.",
            style: config?.style || "Evaluator",
            company: config?.company || "",
            location: config?.location || "",
            user_email: user?.email || "",
            user_id: user?.uid || "",
          }),
        }
      );

      const data = await res.json();
      const spokenMessage = data.spoken_message || data.feedback;

      setAiFeedback(data.feedback);

      // Add AI message to conversation log
      if (spokenMessage && spokenMessage.trim()) {
        setConversationLog((prev) => [
          ...prev,
          { role: "ai", content: spokenMessage },
        ]);
      }

      if (avatarRef.current?.speak) {
        setAiSpeaking(true);
        await avatarRef.current.speak(spokenMessage);
        setAiSpeaking(false);
      }
    } catch (err) {
      console.error("❌ System Design API error:", err);

      // Add error message to conversation log
      setConversationLog((prev) => [
        ...prev,
        {
          role: "system",
          content: "Error processing response. Please try again.",
        },
      ]);
    }
  };

  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;
    console.log("🟡 SystemDesignInterview mounted");

    // Add initial system message
    setConversationLog([
      { role: "system", content: "Preparing your system design interview..." },
    ]);

    const startInterview = async () => {
      try {
        const res = await fetch(
          "http://localhost:8000/api/interview/system-design/init",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              session_id: sessionId.current,
              interview_type: "system design",
              focus_system: config?.system || "",
              job_role: config?.job_role || "Backend Engineer",
              candidate_level: config?.experience_level || "entry",
              company: config?.company || "",
              location: config?.location || "",
              resume: config?.resume || "No resume provided.",
              style: config?.style || "Evaluator",
              user_email: user?.email || "",
              user_id: user?.uid || "",
            }),
          }
        );

        const data = await res.json();
        const greetingMessage =
          data.spoken_message || data.system_design_question;

        setQuestion(data.system_design_question);
        setAiFeedback(greetingMessage);
        setIsLoading(false);

        // Update the conversation log
        setConversationLog([
          {
            role: "system",
            content: "System design interview session started",
          },
          { role: "ai", content: greetingMessage },
        ]);

        const avatarReady = await waitForAvatarReady();
        if (avatarReady) {
          console.log(
            "🟣 Avatar ready, attempting to send greeting with retries"
          );
          await sendInitialGreeting(greetingMessage);
        } else {
          console.warn("⚠️ Avatar not ready after waiting");
          // Try one more time even if it doesn't report ready
          console.log("🔄 Trying one final attempt to speak anyway");
          setTimeout(async () => {
            await sendInitialGreeting(greetingMessage);
          }, 2000);
        }
      } catch (err) {
        console.error("❌ System Design init error:", err);
        setIsLoading(false);

        // Add error message to conversation log
        setConversationLog((prev) => [
          ...prev,
          {
            role: "system",
            content:
              "Error initializing interview. Please try refreshing the page.",
          },
        ]);
      }
    };

    startInterview();
  }, [config, user]);

  const handleManualEnd = async () => {
    const closingMessage =
      "Thanks for walking me through your system. Good luck with your preparation!";

    // Add system message to conversation log
    setConversationLog((prev) => [
      ...prev,
      { role: "system", content: "Interview manually ended by user." },
      { role: "ai", content: closingMessage },
    ]);

    try {
      if (avatarRef.current?.speak) {
        setAiSpeaking(true);
        await avatarRef.current.speak(closingMessage);
        setAiSpeaking(false);
      }

      if (avatarRef.current?.endSession) {
        await avatarRef.current.endSession();
      }
      // ✅ Trigger feedback
      await generateFeedback({
        user_id: user.uid,
        session_id: sessionId.current,
        interview_type: "system-design",
        job_role: config?.job_role,
        level: config?.experience_level,
        style: config?.style,
        endpointCompletion: "system-design",
      });

      setTimeout(() => {
        navigate("/dashboard/system-design");
      }, 1500);
    } catch (err) {
      console.error("❌ Manual end error:", err);
      navigate("/dashboard/system-design");
    }
  };

  const handleTimedOutEnd = async () => {
    const farewellPrompt =
      "The interview is ending. Please provide final thoughts on the design.";

    // Add system message indicating end of interview
    setConversationLog((prev) => [
      ...prev,
      {
        role: "system",
        content: "Interview time limit reached. Wrapping up...",
      },
    ]);

    try {
      const res = await fetch(
        "http://localhost:8000/api/interview/system-design",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_id: sessionId.current,
            spoken_response: farewellPrompt,
            canvas_data: getCanvasImage() || [],
            interview_type: config?.interview_type || "system design",
            job_role: config?.job_role || "Backend Engineer",
            candidate_level: config?.experience_level || "Mid level",
            resume: config?.resume || "No resume provided.",
            style: config?.style || "Evaluator",
            company: config?.company || "",
            location: config?.location || "",
            user_email: user?.email || "",
            user_id: user?.uid || "",
          }),
        }
      );

      const data = await res.json();
      const closingMessage =
        data.spoken_message ||
        "Time is up! Thanks for presenting your design. We hope this was helpful.";

      // Add AI's closing message to the conversation
      setConversationLog((prev) => [
        ...prev,
        { role: "ai", content: closingMessage },
      ]);

      if (avatarRef.current?.speak) {
        setAiSpeaking(true);
        await avatarRef.current.speak(closingMessage);
        setAiSpeaking(false);
      }

      if (avatarRef.current?.endSession) {
        await avatarRef.current.endSession();
      }

      // Add system message about redirecting
      setConversationLog((prev) => [
        ...prev,
        {
          role: "system",
          content: "Interview ended. Redirecting to dashboard...",
        },
      ]);

      // ✅ Trigger feedback
      await generateFeedback({
        user_id: user.uid,
        session_id: sessionId.current,
        interview_type: "system-design",
        job_role: config?.job_role,
        level: config?.experience_level,
        style: config?.style,
        endpointCompletion: "system-design",
      });

      setTimeout(() => {
        navigate("/dashboard/system-design");
      }, 3000);
    } catch (err) {
      console.error("❌ Timeout end error:", err);
      navigate("/dashboard/system-design");
    }
  };

  if (loadingUserInfo) return null; // Or a spinner if you prefer
  if (blocked) return <BlockedModal onClose={() => setBlocked(false)} />;
  if (isLoading) return <LoadingOverlay />;

  return (
    <div className={styles.wrapper}>
      {/* Top fixed header with clock and end button */}
      <div className={styles.clockRow}>
        <Clock durationMinutes={45} onEnd={handleTimedOutEnd} />
        <button className={styles.endButton} onClick={handleManualEnd}>
          End Interview
        </button>
      </div>

      <div className={styles.canvasArea}>
        <h2 className={styles.questionBox}>{question}</h2>
        <SystemDesignCanvas canvasRef={canvasRef} />
      </div>

      <div className={styles.sidebar}>
        <div className={styles.sidebarContent}>
          {/* Avatar + Camera */}
          <div className={styles.avatarBox}>
            <HeyGenAvatarStreamer
              ref={avatarRef}
              avatarId="e0e84faea390465896db75a83be45085"
              voiceId="a3a51db09788457b922674bab038dab8"
              setAiSpeaking={setAiSpeaking}
              width="100%"
              height="100%"
            />
            <UserCameraPreview />
          </div>

          {/* Transcript View */}
          <TranscriptView
            conversationLog={conversationLog}
            aiSpeaking={aiSpeaking}
          />

          {/* Live Transcriber */}
          <LiveTranscriber
            aiSpeaking={aiSpeaking}
            onFinalTranscript={(newTranscript) => {
              if (aiSpeaking) return;

              finalTranscriptBuffer.current += ` ${newTranscript}`.trim();

              if (finalDebounceTimeout.current) {
                clearTimeout(finalDebounceTimeout.current);
              }

              finalDebounceTimeout.current = setTimeout(() => {
                if (
                  finalTranscriptBuffer.current.trim().length > 0 &&
                  !aiSpeaking
                ) {
                  handleFinalTranscript(finalTranscriptBuffer.current.trim());
                  finalTranscriptBuffer.current = "";
                }
              }, 0);
            }}
          />

          {/* 🔐 Permission warning */}
          {permissionsGranted === false && (
            <div
              style={{
                marginTop: "1.5rem",
                padding: "1.5rem",
                background: "#1f1f2e",
                border: "1px solid red",
                borderRadius: "8px",
                color: "white",
                textAlign: "center",
              }}
            >
              <h2>Permissions Needed</h2>
              <p>
                Please enable your <strong>camera and microphone</strong> in
                your browser settings.
              </p>
              <p>Click the 🔒 icon near the address bar and allow access.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SystemDesignInterview;
