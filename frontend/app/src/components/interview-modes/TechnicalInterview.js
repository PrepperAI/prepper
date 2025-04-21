import React, { useRef, useState, useEffect } from "react";
import CodeEditorPanel from "../CodeEditorPanel";
import UserCameraPreview from "../UserCameraPreview";
import LiveTranscriber from "../LiveTranscriber";
import TranscriptView from "./TranscriptView"; // Our transcript component
import styles from "./TechnicalInterview.module.css";
import { useUser } from "../../context/UserContext";
import Clock from "../clock/Clock";
import { useNavigate } from "react-router-dom";
import BlockedModal from "../BlockedModal";
import HeyGenAvatarStreamer from "../HeyGenAvatarStreamer";
import { generateFeedback } from "../../utils/getFeedback";
import { API_BASE_URL } from "../../utils/api";
import StreamlinedAzureTranscriber from "../SystemDesign/TestTrans";

// Loading overlay component
const LoadingOverlay = ({
  message = "Preparing your technical interview...",
}) => {
  return (
    <div className={styles.loadingOverlay}>
      <div className={styles.loader}></div>
      <p>{message}</p>
      <p className={styles.loadingSubtext}>This may take a few seconds</p>
    </div>
  );
};

const TechnicalInterview = ({ config }) => {
  const sessionId = useRef(crypto.randomUUID());
  const finalTranscriptBuffer = useRef("");
  const finalDebounceTimeout = useRef(null);
  const [codeSnapshot, setCodeSnapshot] = useState({
    code: "",
    lang: "python",
  });
  const [transcript, setTranscript] = useState("");
  const [aiFeedback, setAiFeedback] = useState("");
  const resumeText = config?.resume || "";
  const hasInitializedRef = useRef(false);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useUser();
  const navigate = useNavigate();
  const [blocked, setBlocked] = useState(false);
  const [checkedAttempts, setCheckedAttempts] = useState(false);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const avatarRef = useRef();
  const [conversationLog, setConversationLog] = useState([]);
  // Add state to track if transcription should be active
  const [transcriptionActive, setTranscriptionActive] = useState(true);
  // Reference to the LiveTranscriber component
  const liveTranscriberRef = useRef();
  const [permissionsGranted, setPermissionsGranted] = useState(null);
  const [loadingUserInfo, setLoadingUserInfo] = useState(true);
  const [waitingForCompletion, setWaitingForCompletion] = useState(false);

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

    if (!user.isPremium && attempts.technical <= 0) {
      console.log("🚫 Blocking access to technical interview");
      setBlocked(true);
    }

    // ✅ We're now sure everything is loaded
    setLoadingUserInfo(false);
  }, [user]);

  // New helper function for sending the initial greeting with retries
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

  console.log("📤 Sending Technical Interview Init Request with:", {
    session_id: sessionId.current,
    interview_type: config?.interview_type,
    job_role: config?.role,
    candidate_level: config?.experience_level,
    company: config?.company,
    difficulty: config?.difficulty,
    focus_area: config?.focus_area,
    resume: resumeText,
  });

  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;
    console.log("🟡 TechnicalInterview mounted");

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
        // Add a system message to the conversation to indicate initialization
        setConversationLog([
          {
            role: "system",
            content: "Preparing your technical interview session...",
          },
        ]);

        const response = await fetch(
          `${API_BASE_URL}/api/interview/technical/init`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              session_id: sessionId.current,
              interview_type: config?.interview_type || "technical coding",
              job_role: config?.role || "Backend Software Engineer",
              candidate_level: config?.experience_level || "entry",
              company: config?.company || "",
              difficulty: config?.difficulty || "Medium",
              focus_area: config?.focus_area || "",
              resume: resumeText || "No resume provided.",
              user_id: user?.uid || null,
              user_email: user?.email || null,
            }),
          }
        );

        if (!response.ok) throw new Error("Failed to initialize interview");
        const data = await response.json();
        const { spoken_message, code_prompt } = data;

        if (spoken_message) {
          setAiFeedback(spoken_message);
          // Update the conversation log
          setConversationLog((prev) => [
            { role: "system", content: "Technical interview session started" },
            { role: "ai", content: spoken_message },
          ]);
        }

        if (code_prompt) {
          setCodeSnapshot((prev) => ({ ...prev, code: code_prompt }));
        }

        setIsLoading(false);

        const avatarReady = await waitForAvatarReady();
        if (avatarReady && spoken_message) {
          console.log(
            "🟣 Avatar ready, attempting to send greeting with retries"
          );
          await sendInitialGreeting(spoken_message);
        } else if (spoken_message) {
          console.warn("⚠️ Avatar not ready after waiting");
          // Try one more time even if it doesn't report ready
          console.log("🔄 Trying one final attempt to speak anyway");
          setTimeout(async () => {
            await sendInitialGreeting(spoken_message);
          }, 2000);
        }
      } catch (err) {
        console.error("❌ Technical interview init error:", err);
        setConversationLog((prev) => [
          ...prev,
          {
            role: "system",
            content:
              "Error initializing interview. Please try refreshing the page.",
          },
        ]);
        setIsLoading(false);
      }
    };

    initInterview();

    // Cleanup function to ensure transcription is stopped when component unmounts
    return () => {
      stopTranscription();
    };
  }, [config, user]);

  const handleFinalTranscript = async (spokenTranscript) => {
    if (!spokenTranscript || spokenTranscript.length < 2) return;
    setConversationLog((prev) => [
      ...prev,
      { role: "user", content: spokenTranscript },
    ]);
    try {
      // Add the user's message to the conversation immediately

      const response = await fetch(`${API_BASE_URL}/api/interview/technical`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId.current,
          code: codeSnapshot.code,
          language: codeSnapshot.lang,
          spoken_response: spokenTranscript,
          interview_type: config?.interview_type || "technical coding",
          job_role: config?.role || "Backend Software Engineer",
          candidate_level: config?.experience_level || "entry",
          company: config?.company || "",
          difficulty: config?.difficulty || "Medium",
          focus_area: config?.focus_area || "",
          resume: resumeText || "No resume provided.",
          user_id: user?.uid || null,
          user_email: user?.email || null,
        }),
      });

      if (!response.ok) throw new Error("Interview API request failed");
      const data = await response.json();
      console.log("🟣 AI response:", data);

      // Handle empty or irrelevant responses
      if (!data.feedback) {
        console.warn("⚠️ No AI response — input deemed irrelevant.");
        setConversationLog((prev) => [
          ...prev,
          {
            role: "system",
            content:
              "No relevant response detected. Please try asking a technical question or explaining your approach.",
          },
        ]);
        return;
      }

      const aiMessage = data.feedback;
      const spokenMessage = aiMessage;

      setTranscript(spokenTranscript);
      setAiFeedback(aiMessage);

      if (spokenMessage && spokenMessage.trim()) {
        setConversationLog((prev) => [
          ...prev,
          { role: "ai", content: spokenMessage },
        ]);
      }

      if (avatarRef.current?.speak && spokenMessage) {
        setAiSpeaking(true);
        await avatarRef.current.speak(spokenMessage);
        setAiSpeaking(false);
      }
    } catch (err) {
      console.error("❌ Technical Interview error:", err);
      setConversationLog((prev) => [
        ...prev,
        {
          role: "system",
          content: "Error receiving AI response. Please try again.",
        },
      ]);
    }
  };

  // Function to stop transcription
  const stopTranscription = () => {
    setTranscriptionActive(false);

    // Call stop method on LiveTranscriber if it exists
    if (liveTranscriberRef.current?.stopTranscription) {
      liveTranscriberRef.current.stopTranscription();
      console.log("🎙️ Transcription stopped");
    }

    // Clear any pending transcription processing
    if (finalDebounceTimeout.current) {
      clearTimeout(finalDebounceTimeout.current);
      finalDebounceTimeout.current = null;
    }
  };

  const handleTimedOutEnd = async () => {
    // First stop transcription
    stopTranscription();

    // Add system message indicating end of interview
    setConversationLog((prev) => [
      ...prev,
      {
        role: "system",
        content: "Interview time limit reached. Wrapping up...",
      },
    ]);

    const farewellPrompt =
      "The interview is ending. Please thank the candidate, encourage them, and say goodbye politely.";

    try {
      const response = await fetch(`${API_BASE_URL}/api/interview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId.current,
          message: farewellPrompt,
          interview_type: config?.interview_type,
          role: config?.job_role,
          experience_level: config?.experience_level,
          parsed_resume: config?.resume,
          company: config?.company,
          stress_level: config?.stress,
          style: config?.style,
          focus_areas: config?.focus_areas,
          location: config?.location,
          user_uid: user?.uid,
          user_email: user?.email,
        }),
      });

      const data = await response.json();
      const closingMessage = data.response;

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
        interview_type: "technical coding",
        job_role: config?.job_role,
        level: config?.experience_level,
        style: config?.style,
        endpointCompletion: "technical",
      });

      setTimeout(() => {
        navigate("/dashboard/technical");
      }, 3000);
    } catch (err) {
      console.error("❌ Error ending interview on timeout:", err);
      navigate("/dashboard/technical");
    }
  };

  const handleManualEnd = async () => {
    // First stop transcription
    stopTranscription();

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
      interview_type: "technical coding",
      job_role: config?.job_role,
      level: config?.experience_level,
      style: config?.style,
      endpointCompletion: "technical",
    });

    setTimeout(() => {
      navigate("/dashboard/technical");
    }, 1500);
  };

  if (loadingUserInfo) return null; // Or a spinner if you prefer
  if (blocked) return <BlockedModal onClose={() => setBlocked(false)} />;

  // Use our custom loading overlay instead of LoadingScreen
  if (isLoading) return <LoadingOverlay />;

  return (
    <div className={styles.container}>
      <div className={styles.clockRow}>
        <Clock durationMinutes={45} onEnd={handleTimedOutEnd} />
        <button className={styles.endButton} onClick={handleManualEnd}>
          End Interview
        </button>
      </div>

      <div className={styles.codePanel}>
        <CodeEditorPanel
          language={codeSnapshot.lang}
          initialCode={codeSnapshot.code}
          onCodeChange={(code, lang) => {
            setCodeSnapshot({ code, lang });
            console.log("💾 Code updated:", code);
          }}
          options={{
            wordWrap: "on",
            wrappingIndent: "same",
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            fontSize: 14,
            lineNumbers: "on",
            automaticLayout: true,
          }}
        />
      </div>

      <div className={styles.sidebar}>
        <div className={styles.stack}>
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

          <TranscriptView
            conversationLog={conversationLog}
            aiSpeaking={aiSpeaking}
            waitingForCompletion={waitingForCompletion}
          />
          <StreamlinedAzureTranscriber
            aiSpeaking={aiSpeaking}
            onFinalTranscript={(newTranscript) => {
              const cleaned = newTranscript.trim();
              if (aiSpeaking) return;
              handleFinalTranscript(cleaned);
            }}
            onWaitingChange={(isWaiting) => {
              setWaitingForCompletion(isWaiting); // this is your state in parent
            }}
          />

          {/* 🔐 Permissions fallback */}
          {permissionsGranted === false && (
            <div
              style={{
                padding: "2rem",
                color: "white",
                background: "#1f1f2e",
                border: "1px solid red",
                borderRadius: "8px",
                marginTop: "1rem",
              }}
            >
              <h2>Permissions Needed</h2>
              <p>
                Please enable your <strong>camera and microphone</strong> in the
                browser settings.
              </p>
              <p>
                Look for the 🔒 icon near the address bar and click "Allow".
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TechnicalInterview;
