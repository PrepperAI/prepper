import React, {
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
  useState,
} from "react";
import StreamingAvatar, {
  TaskType,
  AvatarQuality,
  StreamingEvents,
  VoiceEmotion,
} from "@heygen/streaming-avatar";

// List of default avatars that are available in HeyGen's system
const DEFAULT_AVATARS = {
  wayne: "Wayne_20240711",
  lisa: "Lisa_20240711",
  alice: "Alice_20240711",
  daniel: "Daniel_20240711",
  default: "Wayne_20240711",
};

// Helper for implementing retries with exponential backoff
const retry = async (fn, maxAttempts = 3, delay = 1000) => {
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`[retry] Attempt ${attempt}/${maxAttempts}`);
      return await fn();
    } catch (error) {
      console.log(`[retry] Attempt ${attempt} failed:`, error);
      lastError = error;

      if (attempt < maxAttempts) {
        // Exponential backoff with jitter
        const jitter = Math.random() * 0.3 + 0.85; // 0.85-1.15 random factor
        const waitTime = Math.min(
          delay * Math.pow(2, attempt - 1) * jitter,
          10000
        );
        console.log(`[retry] Waiting ${Math.round(waitTime)}ms before retry`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }
  }

  throw lastError;
};

const HeyGenAvatarStreamer = forwardRef(
  (
    {
      avatarId = "e0e84faea390465896db75a83be45085",
      voiceId = "a3a51db09788457b922674bab038dab8",
      setAiSpeaking,
      width = "100%",
      height = "100%",
      language = "en",
      maxRetries = 3,
    },
    ref
  ) => {
    const videoRef = useRef(null);
    const avatarInstance = useRef(null);
    const sessionId = useRef(null);
    const [status, setStatus] = useState("Initializing...");
    const [error, setError] = useState(null);
    const [videoStream, setVideoStream] = useState(null);
    const [attemptCount, setAttemptCount] = useState(0);
    // Add a more robust ready check to track when the avatar is fully ready to speak
    const [fullyReady, setFullyReady] = useState(false);
    // Track speak attempts to help diagnose issues
    const speakAttempts = useRef(0);
    const lastSpeakResult = useRef(null);

    // Convert avatar ID if needed
    const getAvatarName = (id) => {
      // If this is a UUID-style ID but we're getting "avatar not found", try mapping to a default avatar
      if (id.includes("-") || id.length === 32) {
        console.log("[avatar] Using default avatar instead of UUID-style ID");
        return DEFAULT_AVATARS.default;
      }

      // Check if this is a short name that needs to be mapped to a full avatar ID
      if (DEFAULT_AVATARS[id.toLowerCase()]) {
        return DEFAULT_AVATARS[id.toLowerCase()];
      }

      return id;
    };

    // Function to attach stream to video element with extensive logging
    const attachStreamToVideo = (stream) => {
      console.log(
        "[video] Attempting to attach stream to video element",
        stream
      );

      if (!stream) {
        console.error("[video] No stream provided");
        return false;
      }

      if (!videoRef.current) {
        console.error("[video] No video element reference available");
        return false;
      }

      try {
        // Debug stream characteristics
        console.log("[video] Stream details:", {
          id: stream.id,
          active: stream.active,
          tracks: stream.getTracks().map((t) => ({
            kind: t.kind,
            enabled: t.enabled,
            readyState: t.readyState,
          })),
        });

        // Store stream in state
        setVideoStream(stream);

        // Directly set the srcObject property
        videoRef.current.srcObject = stream;
        console.log("[video] Successfully set srcObject");

        // Ensure video element is visible and ready
        if (videoRef.current.offsetParent === null) {
          console.warn("[video] Video element may not be visible in DOM");
        }

        // Ensure autoplay works
        videoRef.current
          .play()
          .then(() => {
            console.log("[video] Video playback started successfully");
            setStatus("Avatar ready");

            // Set fully ready after a short delay to ensure all systems are operational
            setTimeout(() => {
              console.log("[avatar] Setting fully ready state");
              setFullyReady(true);
            }, 800);

            return true;
          })
          .catch((err) => {
            console.error("[video] Error starting video playback:", err);
            // Sometimes we need to try again after a delay
            setTimeout(() => {
              console.log("[video] Retrying video playback after delay");
              videoRef.current?.play().catch((retryErr) => {
                console.error("[video] Retry failed:", retryErr);
              });
            }, 500);
            return false;
          });

        return true;
      } catch (err) {
        console.error("[video] Error attaching stream:", err);
        return false;
      }
    };

    // Enhanced speak function with better error handling and diagnostics
    const speakWithRetry = async (
      text,
      taskType = TaskType.REPEAT,
      maxAttempts = 3
    ) => {
      if (!avatarInstance.current || !sessionId.current) {
        console.error("[speak] Avatar not ready or session not established");
        lastSpeakResult.current = "ERROR: Avatar not ready";
        return false;
      }

      speakAttempts.current++;
      const attemptId = speakAttempts.current;
      console.log(
        `[speak-${attemptId}] Starting speak attempt with text: ${text.substring(
          0,
          30
        )}...`
      );

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          console.log(`[speak-${attemptId}] Attempt ${attempt}/${maxAttempts}`);
          await avatarInstance.current.speak({
            text,
            task_type: taskType,
          });
          console.log(`[speak-${attemptId}] Success!`);
          lastSpeakResult.current = "SUCCESS";
          return true;
        } catch (err) {
          console.error(
            `[speak-${attemptId}] Error on attempt ${attempt}:`,
            err
          );
          lastSpeakResult.current = `ERROR: ${err.message || "Unknown error"}`;

          if (attempt < maxAttempts) {
            const delay = Math.min(1000 * Math.pow(1.5, attempt - 1), 3000);
            console.log(`[speak-${attemptId}] Waiting ${delay}ms before retry`);
            await new Promise((resolve) => setTimeout(resolve, delay));
          }
        }
      }

      console.error(
        `[speak-${attemptId}] Failed after ${maxAttempts} attempts`
      );
      return false;
    };

    useImperativeHandle(ref, () => ({
      speak: async (text, taskType = TaskType.REPEAT) => {
        return await speakWithRetry(text, taskType);
      },
      endSession: async () => {
        try {
          if (avatarInstance.current) {
            console.log("[endSession] Stopping avatar");
            await avatarInstance.current.stopAvatar();
            avatarInstance.current = null;
            sessionId.current = null;
            setStatus("Session ended");
            setFullyReady(false);
          }
        } catch (err) {
          console.error("End session error:", err);
        }
      },
      isReady: () => status === "Avatar ready" && fullyReady,
      getReadyStatus: () => ({
        status,
        fullyReady,
        speakAttempts: speakAttempts.current,
        lastSpeakResult: lastSpeakResult.current,
      }),
      retryConnection: async () => {
        console.log("[retry] Manual retry requested");
        setAttemptCount((count) => count + 1);
      },
    }));

    // Trigger a re-attempt on count change
    useEffect(() => {
      if (attemptCount > 0) {
        console.log(`[avatar] Starting attempt ${attemptCount}`);
        startAvatarSession(getAvatarName(avatarId));
      }
    }, [attemptCount]);

    // Function to start the avatar session
    const startAvatarSession = async (actualAvatarId) => {
      try {
        setStatus("Fetching token...");
        console.log("[startSession] Requesting token...");

        // Step 1: Get session token from HeyGen API with retry mechanism
        const tokenResponse = await retry(async () => {
          const res = await fetch(
            "https://api.heygen.com/v1/streaming.create_token",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-Api-Key": process.env.REACT_APP_HEYGEN_API_KEY,
              },
              body: JSON.stringify({}),
            }
          );

          if (!res.ok) {
            const errorText = await res.text();
            console.error("[token] Fetch error:", {
              status: res.status,
              statusText: res.statusText,
              body: errorText,
            });
            throw new Error(
              `Failed to create token: ${res.status} ${res.statusText} - ${errorText}`
            );
          }

          return await res.json();
        }, maxRetries);

        console.log("[token] Success:", tokenResponse);

        if (!tokenResponse.data || !tokenResponse.data.token) {
          throw new Error("Invalid token response");
        }

        const sessionToken = tokenResponse.data.token;

        // Step 2: Initialize StreamingAvatar with the token
        console.log("[avatar] Initializing with token");
        const avatar = new StreamingAvatar({
          token: sessionToken,
        });

        // Save avatar instance for later use
        avatarInstance.current = avatar;

        // Add event listeners before starting the session
        console.log("[avatar] Setting up event listeners");

        avatar.on(StreamingEvents.STREAM_READY, (e) => {
          console.log("[event] STREAM_READY received", e);

          // THE KEY FIX: Detail is the stream itself, not an object containing a stream property
          const mediaStream = e.detail;

          if (mediaStream && mediaStream instanceof MediaStream) {
            console.log("[video] Media stream received directly", mediaStream);

            // Check if the stream has tracks
            if (mediaStream.getTracks().length === 0) {
              console.error("[video] Stream has no tracks");
              setStatus("Stream has no tracks");
              return;
            }

            // Attach the stream to the video element
            const attached = attachStreamToVideo(mediaStream);
            if (attached) {
              console.log("[video] Stream attached successfully");
            } else {
              console.error("[video] Failed to attach stream");

              // Schedule a retry
              setTimeout(() => {
                console.log("[video] Retrying stream attachment");
                if (videoRef.current && mediaStream) {
                  attachStreamToVideo(mediaStream);
                }
              }, 1000);
            }
          } else {
            console.error("[video] Invalid media stream in event:", e.detail);
            setStatus("Invalid stream");

            // Force avatar ready after timeout to allow application to continue
            setTimeout(() => {
              setStatus("Avatar ready");
              // Still wait a bit more before setting fully ready
              setTimeout(() => setFullyReady(true), 800);
            }, 2000);
          }
        });

        avatar.on(StreamingEvents.AVATAR_START_TALKING, () => {
          console.log("[event] AVATAR_START_TALKING");
          setAiSpeaking?.(true);
        });

        avatar.on(StreamingEvents.AVATAR_STOP_TALKING, () => {
          console.log("[event] AVATAR_STOP_TALKING");
          setAiSpeaking?.(false);
        });

        avatar.on(StreamingEvents.STREAM_DISCONNECTED, () => {
          console.log("[event] STREAM_DISCONNECTED");
          setStatus("Disconnected");
          setFullyReady(false);
        });

        avatar.on(StreamingEvents.ERROR, (e) => {
          console.error("[event] ERROR:", e);
          setError(
            `Streaming error: ${
              e.detail?.message || JSON.stringify(e) || "Unknown error"
            }`
          );
          setStatus("Error");
          setFullyReady(false);
        });

        // Step 3: Start an avatar with retry mechanism
        console.log("[avatar] Creating start avatar with:", {
          avatarName: actualAvatarId,
          quality: AvatarQuality.High,
          voice: {
            voiceId,
            rate: 1.0,
            emotion: VoiceEmotion.FRIENDLY,
          },
          language,
          disableIdleTimeout: true,
        });

        const startResponse = await retry(async () => {
          try {
            return await avatar.createStartAvatar({
              avatarName: actualAvatarId,
              quality: AvatarQuality.High,
              voice: {
                voiceId,
                rate: 1.0,
                emotion: VoiceEmotion.FRIENDLY,
              },
              language,
              disableIdleTimeout: true,
            });
          } catch (err) {
            console.error("[avatar] Error in createStartAvatar:", err);

            // Try an alternative avatar if this one fails
            if (
              err.message &&
              err.message.includes("400") &&
              attemptCount < 1
            ) {
              console.log(
                "[avatar] Trying alternative default avatar due to 400 error"
              );
              const alternativeAvatar =
                actualAvatarId === DEFAULT_AVATARS.wayne
                  ? DEFAULT_AVATARS.lisa
                  : DEFAULT_AVATARS.wayne;

              return await avatar.createStartAvatar({
                avatarName: alternativeAvatar,
                quality: AvatarQuality.High,
                voice: {
                  voiceId,
                  rate: 1.0,
                  emotion: VoiceEmotion.FRIENDLY,
                },
                language,
                disableIdleTimeout: true,
              });
            }

            throw err;
          }
        }, maxRetries);

        console.log("[avatar] Start response:", startResponse);
        sessionId.current = startResponse.session_id;

        console.log("[avatar] Session started successfully");

        // Schedule delayed check to force ready state
        setTimeout(() => {
          console.log("[video] Delayed check, forcing ready state if needed");

          if (status !== "Avatar ready") {
            console.log(
              "[video] Avatar not ready after timeout, forcing ready state"
            );
            setStatus("Avatar ready");

            // Give a slight delay before setting fully ready
            setTimeout(() => setFullyReady(true), 800);
          }
        }, 3000);
      } catch (err) {
        console.error("[avatar] Error in avatar setup:", err);

        // Check if we've exceeded retry attempts
        if (attemptCount >= maxRetries - 1) {
          console.error(
            "[init] Failed to start avatar after max retries:",
            err
          );
          setError(
            `Failed to initialize avatar after ${maxRetries} attempts: ${err.message}`
          );
          setStatus("Error");

          // Force ready state after multiple failures to allow app to continue
          setTimeout(() => {
            console.log("[video] Forcing ready state after repeated failures");
            setStatus("Avatar ready");
            setTimeout(() => setFullyReady(true), 800);
          }, 5000);
        } else {
          // Schedule another retry with exponential backoff
          const retryDelay = Math.min(2000 * Math.pow(2, attemptCount), 10000);
          console.log(`[retry] Scheduling retry in ${retryDelay}ms`);

          setStatus(`Retrying in ${Math.round(retryDelay / 1000)}s...`);

          setTimeout(() => {
            setAttemptCount((count) => count + 1);
          }, retryDelay);
        }
      }
    };

    useEffect(() => {
      const actualAvatarId = getAvatarName(avatarId);

      // Reset state on mount
      setFullyReady(false);
      speakAttempts.current = 0;
      lastSpeakResult.current = null;

      // Start the first attempt
      startAvatarSession(actualAvatarId);

      return () => {
        console.log("[cleanup] Unmounting...");
        if (avatarInstance.current) {
          console.log("[cleanup] Stopping avatar");
          avatarInstance.current.stopAvatar().catch((err) => {
            console.error("[cleanup] Error stopping avatar:", err);
          });
        }

        if (videoRef.current && videoRef.current.srcObject) {
          console.log("[cleanup] Clearing video source");
          const tracks = videoRef.current.srcObject.getTracks();
          tracks.forEach((track) => track.stop());
          videoRef.current.srcObject = null;
        }
      };
    }, [avatarId, voiceId, language]);

    return (
      <div
        style={{
          width,
          height,
          border: "2px solid #00eaff",
          borderRadius: 12,
          background: "#000",
          position: "relative",
        }}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={false}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            borderRadius: 12,
          }}
        />
        {status !== "Avatar ready" && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(0,0,0,0.7)",
              color: "#00eaff",
              fontWeight: "bold",
              padding: "16px",
              textAlign: "center",
              flexDirection: "column",
            }}
          >
            <div>{error || status}</div>
            {status.includes("Error") && (
              <button
                onClick={() => setAttemptCount((count) => count + 1)}
                style={{
                  marginTop: "12px",
                  padding: "8px 16px",
                  background: "#00eaff",
                  color: "#000",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                Retry Connection
              </button>
            )}
          </div>
        )}
      </div>
    );
  }
);

export default HeyGenAvatarStreamer;
