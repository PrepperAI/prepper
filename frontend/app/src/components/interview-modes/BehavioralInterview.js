import React, { useRef, useState, useEffect } from "react";
import UserCameraPreview from "../UserCameraPreview";
import LiveTranscriber from "../LiveTranscriber";
import TranscriptView from "./TranscriptView"; // Our new component
import LoadingOverlay from "./LoadingOverlay"; // Import the loading component
import EmoticonReactionBar from "./EmoticonReactionBar"; // Import the reaction bar
import styles from "./BehavioralInterview.module.css";
import { useUser } from "../../context/UserContext";
import Clock from "../clock/Clock";
import { useNavigate } from "react-router-dom";
import BlockedModal from "../BlockedModal";
import HeyGenAvatarStreamer from "../HeyGenAvatarStreamer";
import { generateFeedback } from "../../utils/getFeedback";

const BehavioralInterview = ({ config }) => {
  const { user } = useUser();
  const sessionId = useRef(crypto.randomUUID());
  const finalTranscriptBuffer = useRef("");
  const finalDebounceTimeout = useRef(null);
  const [transcript, setTranscript] = useState("");
  const [aiFeedback, setAiFeedback] = useState("");
  const [conversationLog, setConversationLog] = useState([]);
  const [blocked, setBlocked] = useState(false);
  const [checkedAttempts, setCheckedAttempts] = useState(false);
  const hasInitializedRef = useRef(false);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [userReaction, setUserReaction] = useState(null);
  const navigate = useNavigate();
  const avatarRef = useRef();
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
    if (!attempts || typeof attempts.technical !== "number") return;

    if (!user.isPremium && attempts.behavioral <= 0) {
      console.log("🚫 Blocking access to technical interview");
      setBlocked(true);
    }

    // ✅ We're now sure everything is loaded
    setLoadingUserInfo(false);
  }, [user]);

  console.log(
    "Here is your resume:",
    config?.resume,
    config?.role,
    config?.company
  );

  // New helper function for sending the initial greeting with retries
  const sendInitialGreeting = async (message, maxAttempts = 3) => {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      console.log(`🟣 Attempt ${attempt} to send initial greeting`);
      try {
        if (avatarRef.current?.speak) {
          await avatarRef.current.speak(message);
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

  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;
    console.log("🟡 BehavioralInterview mounted");

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

    const initInterview = async () => {
      try {
        setIsInitializing(true);

        // Add a preparing message to the conversation log
        setConversationLog([
          { role: "system", content: "Preparing your interview experience..." },
        ]);

        const response = await fetch(
          "http://localhost:8000/api/interview/init",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              session_id: sessionId.current,
              interview_type: config?.interview_type || "behavioral",
              role: config?.job_role || "Product Manager",
              experience_level: config?.experience_level || "Entry",
              company: config?.company || null,
              stress_level: config?.stress || "Realistic",
              style: config?.style || "Coach",
              focus_areas: config?.focus_areas || [],
              location: config?.location || "",
              parsed_resume: config?.resume || "No resume provided.",
              user_uid: user?.uid || null,
              user_email: user?.email || null,
            }),
          }
        );

        if (!response.ok) throw new Error("Init request failed");

        const data = await response.json();
        const greetingMessage = data.response;
        setAiFeedback(greetingMessage);

        // Update the system message to indicate we're ready
        setConversationLog([
          { role: "system", content: "Interview session started" },
          { role: "ai", content: greetingMessage },
        ]);

        const avatarReady = await waitForAvatarReady();
        if (avatarReady) {
          console.log(
            "🟣 Avatar ready, attempting to send greeting with retries"
          );
          setAiSpeaking(true);
          await sendInitialGreeting(greetingMessage);
          setAiSpeaking(false);
        } else {
          console.warn("⚠️ Avatar not ready after waiting");
          // Try one more time even if it doesn't report ready
          console.log("🔄 Trying one final attempt to speak anyway");
          setTimeout(async () => {
            setAiSpeaking(true);
            await sendInitialGreeting(greetingMessage);
            setAiSpeaking(false);
          }, 2000);
        }

        setIsInitializing(false);
      } catch (error) {
        console.error("❌ Behavioral init error:", error);
        setConversationLog((prev) => [
          ...prev,
          {
            role: "system",
            content:
              "Error initializing interview. Please try refreshing the page.",
          },
        ]);
        setIsInitializing(false);
      }
    };

    initInterview();
  }, [config, user]);

  const handleFinalTranscript = async (spokenTranscript) => {
    if (!spokenTranscript || spokenTranscript.length < 2) return;

    try {
      // Add user's spoken message to conversation log
      setConversationLog((prev) => [
        ...prev,
        { role: "user", content: spokenTranscript },
      ]);

      const response = await fetch("http://localhost:8000/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId.current,
          interview_type: config?.interview_type || "behavioral",
          role: config?.job_role || "Product Manager",
          experience_level: config?.experience_level || "Entry",
          company: config?.company || null,
          stress_level: config?.stress || "Realistic",
          style: config?.style || "Coach",
          focus_areas: config?.focus_areas || [],
          location: config?.location || "",
          parsed_resume: config?.resume || "No resume provided.",
          user_uid: user?.uid || null,
          user_email: user?.email || null,
          message: spokenTranscript,
        }),
      });

      if (!response.ok) throw new Error("Interview API failed");

      const data = await response.json();
      const aiMessage = data.response?.trim();

      console.log("🧠 AI Message:", aiMessage);

      if (!aiMessage || aiMessage.length < 2) {
        console.warn("⚠️ Empty or irrelevant AI message. Not rendering it.");
        setConversationLog((prev) => [
          ...prev,
          {
            role: "system",
            content:
              "No relevant response detected. Please focus on what is relevant to the interview.",
          },
        ]);
        return;
      }

      setTranscript(spokenTranscript);
      setAiFeedback(aiMessage);

      setConversationLog((prev) => [
        ...prev,
        { role: "ai", content: aiMessage },
      ]);

      if (avatarRef.current?.speak) {
        setAiSpeaking(true);
        await avatarRef.current.speak(aiMessage);
        setAiSpeaking(false);
      }
    } catch (err) {
      console.error("❌ Behavioral Interview error:", err);
      setConversationLog((prev) => [
        ...prev,
        {
          role: "system",
          content: "Error receiving AI response. Please try again.",
        },
      ]);
    }
  };

  const handleTimedOutEnd = async () => {
    const farewellPrompt =
      "The interview is ending. Please thank the candidate, encourage them, and say goodbye politely.";

    try {
      setConversationLog((prev) => [
        ...prev,
        {
          role: "system",
          content: "Interview time limit reached. Wrapping up...",
        },
      ]);

      const response = await fetch("http://localhost:8000/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId.current,
          interview_type: config?.interview_type || "behavioral",
          role: config?.job_role || "Product Manager",
          experience_level: config?.experience_level || "Entry",
          company: config?.company || null,
          stress_level: config?.stress || "Realistic",
          style: config?.style || "Coach",
          focus_areas: config?.focus_areas || [],
          location: config?.location || "",
          parsed_resume: config?.resume || "No resume provided.",
          user_uid: user?.uid || null,
          user_email: user?.email || null,
          message: farewellPrompt,
        }),
      });

      const data = await response.json();
      const closingMessage = data.response;

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
        interview_type: "behavioral",
        job_role: config?.job_role,
        level: config?.experience_level,
        style: config?.style,
        endpointCompletion: "behavioral",
      });

      setTimeout(() => {
        navigate("/dashboard/behavioral");
      }, 3000);
    } catch (err) {
      console.error("❌ Error ending interview on timeout:", err);
      navigate("/dashboard/behavioral");
    }
  };

  const handleManualEnd = async () => {
    try {
      setConversationLog((prev) => [
        ...prev,
        {
          role: "system",
          content: "Interview manually ended. Completing session...",
        },
      ]);

      if (avatarRef.current?.endSession) {
        await avatarRef.current.endSession();
      }
      // ✅ Trigger feedback
      await generateFeedback({
        user_id: user.uid,
        session_id: sessionId.current,
        interview_type: "behavioral",
        job_role: config?.job_role,
        level: config?.experience_level,
        style: config?.style,
        endpointCompletion: "behavioral",
      });

      setTimeout(() => {
        navigate("/dashboard/behavioral");
      }, 1500);
    } catch (err) {
      console.error("❌ Error ending interview:", err);
      navigate("/dashboard/behavioral");
    }
  };

  if (loadingUserInfo) return null; // Or a spinner if you prefer

  if (blocked) return <BlockedModal onClose={() => setBlocked(false)} />;
  return (
    <div className={styles.wrapper}>
      {isInitializing && (
        <LoadingOverlay message="Preparing your interview experience..." />
      )}

      <div className={styles.clockRow}>
        <Clock durationMinutes={45} onEnd={handleTimedOutEnd} />
        <button
          className={styles.endButton}
          onClick={handleManualEnd}
          disabled={isInitializing}
        >
          End Interview
        </button>
      </div>

      <div className={styles.videoSection}>
        <HeyGenAvatarStreamer
          ref={avatarRef}
          avatarId="13813b3adcc9416cb5336c6a3c50a76a"
          voiceId="a3a51db09788457b922674bab038dab8"
          setAiSpeaking={setAiSpeaking}
          width="50%"
          height="65vh"
        />

        <UserCameraPreview width="50%" height="65vh" />
      </div>

      <TranscriptView
        conversationLog={conversationLog}
        aiSpeaking={aiSpeaking}
      />

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

      {/* 🔐 Show permission warning if blocked */}
      {permissionsGranted === false && (
        <div
          style={{
            marginTop: "2rem",
            padding: "2rem",
            background: "#1f1f2e",
            border: "1px solid red",
            borderRadius: "8px",
            color: "white",
            textAlign: "center",
          }}
        >
          <h2>Permissions Needed</h2>
          <p>
            Please enable your <strong>camera and microphone</strong> in your
            browser settings to continue the interview.
          </p>
          <p>
            Click the 🔒 icon near the browser address bar and allow access.
          </p>
        </div>
      )}
    </div>
  );
};

export default BehavioralInterview;
