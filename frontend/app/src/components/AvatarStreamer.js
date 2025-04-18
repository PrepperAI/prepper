// import React, {
//   useEffect,
//   useRef,
//   useImperativeHandle,
//   forwardRef,
//   useState,
// } from "react";

// import {
//   startAvatarSession,
//   sendSDPAnswer,
//   sendICECandidate,
//   speakText,
// } from "../utils/api";

// const AvatarStreamer = forwardRef((props, ref) => {
//   const { width = "100%", height = "100%" } = props;

//   const videoRef = useRef(null);
//   const peerConnectionRef = useRef(null);
//   const streamIdRef = useRef(null);
//   const sessionIdRef = useRef(null);
//   const [loading, setLoading] = useState(true);

//   useImperativeHandle(ref, () => ({
//     speak: async (text) => {
//       console.log("📢 Avatar is speaking:", text);
//       if (!streamIdRef.current || !sessionIdRef.current) {
//         throw new Error("No avatar stream available");
//       }

//       const response = await speakText(
//         text,
//         sessionIdRef.current,
//         streamIdRef.current
//       );

//       if (!response.ok) {
//         console.error("Failed to send speech text to avatar");
//         return;
//       }

//       const estimatedMs = Math.max(text.split(" ").length * 100, 1000);
//       return new Promise((resolve) => setTimeout(resolve, estimatedMs));
//     },
//     endSession: async () => {
//       try {
//         const streamId = streamIdRef.current;
//         const sessionId = sessionIdRef.current;

//         if (!streamId || !sessionId) return;

//         await fetch(`https://api.d-id.com/talks/streams/${streamId}`, {
//           method: "DELETE",
//           headers: {
//             Authorization: `Basic ${process.env.REACT_APP_DID_API_KEY}`,
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({ session_id: sessionId }),
//         });

//         if (peerConnectionRef.current) {
//           peerConnectionRef.current.close();
//           peerConnectionRef.current = null;
//         }

//         streamIdRef.current = null;
//         sessionIdRef.current = null;

//         console.log("👋 Avatar session closed.");
//       } catch (err) {
//         console.error("🚨 Error closing avatar stream:", err);
//       }
//     },
//   }));

//   useEffect(() => {
//     const setupStream = async () => {
//       try {
//         const {
//           id: streamId,
//           session_id,
//           offer,
//           ice_servers,
//         } = await startAvatarSession();

//         streamIdRef.current = streamId;
//         sessionIdRef.current = session_id;

//         const pc = new RTCPeerConnection({ iceServers: ice_servers });
//         peerConnectionRef.current = pc;

//         const remoteStream = new MediaStream();

//         // ✅ Safety check: only set srcObject if videoRef is available
//         if (videoRef.current) {
//           videoRef.current.srcObject = remoteStream;
//         } else {
//           console.warn("videoRef.current is null at setupStream()");
//         }

//         pc.ontrack = (event) => {
//           const video = videoRef.current;
//           if (!video) {
//             console.warn("videoRef.current is null in ontrack");
//             return;
//           }

//           const remoteStream = video.srcObject || new MediaStream();
//           remoteStream.addTrack(event.track);
//           video.srcObject = remoteStream;

//           video.onloadedmetadata = () => {
//             video
//               .play()
//               .then(() => setLoading(false))
//               .catch((err) => console.warn("🎥 Video play error:", err));
//           };
//         };

//         pc.onicecandidate = async (event) => {
//           if (event.candidate) {
//             await sendICECandidate(
//               {
//                 candidate: event.candidate.candidate,
//                 sdpMid: event.candidate.sdpMid,
//                 sdpMLineIndex: event.candidate.sdpMLineIndex,
//               },
//               session_id,
//               streamId
//             );
//           }
//         };

//         await pc.setRemoteDescription(offer);
//         const answer = await pc.createAnswer();
//         await pc.setLocalDescription(answer);
//         await sendSDPAnswer(answer.sdp, session_id, streamId);

//         console.log("✅ Avatar stream connected");

//         await speakText(
//           "Hi, I'm your interviewer. Let's begin.",
//           session_id,
//           streamId
//         );
//       } catch (err) {
//         console.error("🚨 Failed to initialize avatar stream:", err);
//       }
//     };

//     // Delay setup to ensure videoRef is mounted
//     const timeout = setTimeout(setupStream, 100); // slight delay
//     return () => {
//       clearTimeout(timeout);
//       if (peerConnectionRef.current) peerConnectionRef.current.close();
//     };
//   }, []);

//   return (
//     <div className="avatar-container" style={{ width, height }}>
//       <div
//         className="avatar-video-frame"
//         style={{
//           width: "100%",
//           height: "100%",
//           border: "2px solid #00eaff",
//           borderRadius: "12px",
//           padding: "4px",
//           boxShadow: "0 0 16px #00eaff88",
//           backgroundColor: "#000",
//           display: "flex",
//           justifyContent: "center",
//           alignItems: "center",
//         }}
//       >
//         {loading ? (
//           <div className="avatar-loader">
//             <div className="spinner" />
//             <p style={{ color: "#ccc", fontSize: "0.9rem" }}>
//               Connecting Avatar...
//             </p>
//           </div>
//         ) : (
//           <video
//             className="avatar-video"
//             ref={videoRef}
//             autoPlay
//             playsInline
//             muted={false}
//             width="320"
//             height="320"
//             style={{
//               width: "100%",
//               height: "100%",
//               objectFit: "cover",
//               borderRadius: "8px",
//             }}
//           />
//         )}
//       </div>
//     </div>
//   );
// });

// export default AvatarStreamer;

// import React, {
//   useEffect,
//   useRef,
//   useImperativeHandle,
//   forwardRef,
//   useState,
// } from "react";

// import {
//   startAvatarSession,
//   sendSDPAnswer,
//   sendICECandidate,
//   speakText,
// } from "../utils/api";

// const AvatarStreamer = forwardRef((props, ref) => {
//   const { width = "100%", height = "100%" } = props;

//   const videoRef = useRef(null);
//   const peerConnectionRef = useRef(null);
//   const streamIdRef = useRef(null);
//   const sessionIdRef = useRef(null);
//   const [loading, setLoading] = useState(true);
//   const [videoElementReady, setVideoElementReady] = useState(false);

//   useImperativeHandle(ref, () => ({
//     speak: async (text) => {
//       console.log("📢 Avatar is speaking:", text);
//       if (!streamIdRef.current || !sessionIdRef.current) {
//         throw new Error("No avatar stream available");
//       }

//       const response = await speakText(
//         text,
//         sessionIdRef.current,
//         streamIdRef.current
//       );

//       if (!response.ok) {
//         console.error("Failed to send speech text to avatar");
//         return;
//       }

//       const estimatedMs = Math.max(text.split(" ").length * 100, 1000);
//       return new Promise((resolve) => setTimeout(resolve, estimatedMs));
//     },
//     endSession: async () => {
//       try {
//         const streamId = streamIdRef.current;
//         const sessionId = sessionIdRef.current;

//         if (!streamId || !sessionId) return;

//         await fetch(`https://api.d-id.com/talks/streams/${streamId}`, {
//           method: "DELETE",
//           headers: {
//             Authorization: `Basic ${process.env.REACT_APP_DID_API_KEY}`,
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({ session_id: sessionId }),
//         });

//         if (peerConnectionRef.current) {
//           peerConnectionRef.current.close();
//           peerConnectionRef.current = null;
//         }

//         streamIdRef.current = null;
//         sessionIdRef.current = null;

//         console.log("👋 Avatar session closed.");
//       } catch (err) {
//         console.error("🚨 Error closing avatar stream:", err);
//       }
//     },
//   }));

//   // Add an effect to set videoElementReady when videoRef is available
//   useEffect(() => {
//     if (videoRef.current) {
//       console.log("✅ Video element is ready");
//       setVideoElementReady(true);
//     }
//   }, []);

//   useEffect(() => {
//     // Only run setupStream when video element is confirmed ready
//     if (!videoElementReady) return;

//     const setupStream = async () => {
//       try {
//         const {
//           id: streamId,
//           session_id,
//           offer,
//           ice_servers,
//         } = await startAvatarSession();

//         streamIdRef.current = streamId;
//         sessionIdRef.current = session_id;

//         const pc = new RTCPeerConnection({ iceServers: ice_servers });
//         peerConnectionRef.current = pc;

//         const remoteStream = new MediaStream();

//         // At this point, we're sure videoRef is available
//         videoRef.current.srcObject = remoteStream;

//         pc.ontrack = (event) => {
//           const video = videoRef.current;
//           // Double-check for safety
//           if (!video) {
//             console.warn("videoRef.current is null in ontrack");
//             return;
//           }

//           const remoteStream = video.srcObject;
//           remoteStream.addTrack(event.track);

//           video.onloadedmetadata = () => {
//             video
//               .play()
//               .then(() => setLoading(false))
//               .catch((err) => console.warn("🎥 Video play error:", err));
//           };
//         };

//         pc.onicecandidate = async (event) => {
//           if (event.candidate) {
//             await sendICECandidate(
//               {
//                 candidate: event.candidate.candidate,
//                 sdpMid: event.candidate.sdpMid,
//                 sdpMLineIndex: event.candidate.sdpMLineIndex,
//               },
//               session_id,
//               streamId
//             );
//           }
//         };

//         await pc.setRemoteDescription(offer);
//         const answer = await pc.createAnswer();
//         await pc.setLocalDescription(answer);
//         await sendSDPAnswer(answer.sdp, session_id, streamId);

//         console.log("✅ Avatar stream connected");
//       } catch (err) {
//         console.error("🚨 Failed to initialize avatar stream:", err);
//       }
//     };

//     setupStream();

//     return () => {
//       if (peerConnectionRef.current) peerConnectionRef.current.close();
//     };
//   }, [videoElementReady]); // Only run when videoElementReady changes to true

//   return (
//     <div className="avatar-container" style={{ width, height }}>
//       <div
//         className="avatar-video-frame"
//         style={{
//           width: "100%",
//           height: "100%",
//           border: "2px solid #00eaff",
//           borderRadius: "12px",
//           padding: "4px",
//           boxShadow: "0 0 16px #00eaff88",
//           backgroundColor: "#000",
//           display: "flex",
//           justifyContent: "center",
//           alignItems: "center",
//         }}
//       >
//         {loading ? (
//           <div className="avatar-loader">
//             <div className="spinner" />
//             <p style={{ color: "#ccc", fontSize: "0.9rem" }}>
//               Connecting Avatar...
//             </p>
//           </div>
//         ) : null}
//         <video
//           className="avatar-video"
//           ref={videoRef}
//           autoPlay
//           playsInline
//           muted={false}
//           width="320"
//           height="320"
//           style={{
//             width: "100%",
//             height: "100%",
//             objectFit: "cover",
//             borderRadius: "8px",
//             display: loading ? "none" : "block",
//           }}
//         />
//       </div>
//     </div>
//   );
// });

// export default AvatarStreamer;
import React, {
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
  useState,
} from "react";

import {
  startAvatarSession,
  sendSDPAnswer,
  sendICECandidate,
  speakText,
} from "../utils/api";

const AvatarStreamer = forwardRef((props, ref) => {
  const { width = "100%", height = "100%" } = props;

  const videoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const streamIdRef = useRef(null);
  const sessionIdRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [videoElementReady, setVideoElementReady] = useState(false);
  const idleIntervalRef = useRef(null);

  useImperativeHandle(ref, () => ({
    speak: async (text) => {
      console.log("📢 Avatar is speaking:", text);
      if (!streamIdRef.current || !sessionIdRef.current) {
        throw new Error("No avatar stream available");
      }

      const response = await speakText(
        text,
        sessionIdRef.current,
        streamIdRef.current
      );

      if (!response.ok) {
        console.error("Failed to send speech text to avatar");
        return;
      }

      const estimatedMs = Math.max(text.split(" ").length * 100, 1000);
      return new Promise((resolve) => setTimeout(resolve, estimatedMs));
    },
    endSession: async () => {
      try {
        clearInterval(idleIntervalRef.current);

        const streamId = streamIdRef.current;
        const sessionId = sessionIdRef.current;

        if (!streamId || !sessionId) return;

        await fetch(`https://api.d-id.com/talks/streams/${streamId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Basic ${process.env.REACT_APP_DID_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ session_id: sessionId }),
        });

        if (peerConnectionRef.current) {
          peerConnectionRef.current.close();
          peerConnectionRef.current = null;
        }

        streamIdRef.current = null;
        sessionIdRef.current = null;

        console.log("👋 Avatar session closed.");
      } catch (err) {
        console.error("🚨 Error closing avatar stream:", err);
      }
    },
  }));

  useEffect(() => {
    if (videoRef.current) {
      console.log("✅ Video element is ready");
      setVideoElementReady(true);
    }
  }, []);

  useEffect(() => {
    if (!videoElementReady) return;

    const setupStream = async () => {
      try {
        const {
          id: streamId,
          session_id,
          offer,
          ice_servers,
        } = await startAvatarSession();

        streamIdRef.current = streamId;
        sessionIdRef.current = session_id;

        const pc = new RTCPeerConnection({ iceServers: ice_servers });
        peerConnectionRef.current = pc;

        const remoteStream = new MediaStream();
        videoRef.current.srcObject = remoteStream;

        pc.ontrack = (event) => {
          const video = videoRef.current;
          if (!video) {
            console.warn("videoRef.current is null in ontrack");
            return;
          }

          const remoteStream = video.srcObject;
          remoteStream.addTrack(event.track);

          video.onloadedmetadata = () => {
            video
              .play()
              .then(() => setLoading(false))
              .catch((err) => console.warn("🎥 Video play error:", err));
          };
        };

        pc.onicecandidate = async (event) => {
          if (event.candidate) {
            await sendICECandidate(
              {
                candidate: event.candidate.candidate,
                sdpMid: event.candidate.sdpMid,
                sdpMLineIndex: event.candidate.sdpMLineIndex,
              },
              session_id,
              streamId
            );
          }
        };

        await pc.setRemoteDescription(offer);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        await sendSDPAnswer(answer.sdp, session_id, streamId);

        console.log("✅ Avatar stream connected");

        // 🔁 Start idle animation loop
        idleIntervalRef.current = setInterval(async () => {
          if (streamIdRef.current && sessionIdRef.current) {
            await speakText(
              "<s></s>",
              sessionIdRef.current,
              streamIdRef.current,
              true // pass ssml flag in your API function
            );
          }
        }, 15000);
      } catch (err) {
        console.error("🚨 Failed to initialize avatar stream:", err);
      }
    };

    setupStream();

    return () => {
      clearInterval(idleIntervalRef.current);
      if (peerConnectionRef.current) peerConnectionRef.current.close();
    };
  }, [videoElementReady]);

  return (
    <div className="avatar-container" style={{ width, height }}>
      <div
        className="avatar-video-frame"
        style={{
          width: "100%",
          height: "100%",
          border: "2px solid #00eaff",
          borderRadius: "12px",
          padding: "4px",
          boxShadow: "0 0 16px #00eaff88",
          backgroundColor: "#000",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {loading ? (
          <div className="avatar-loader">
            <div className="spinner" />
            <p style={{ color: "#ccc", fontSize: "0.9rem" }}>
              Connecting Avatar...
            </p>
          </div>
        ) : null}
        <video
          className="avatar-video"
          ref={videoRef}
          autoPlay
          playsInline
          muted={false}
          width="320"
          height="320"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            borderRadius: "8px",
            display: loading ? "none" : "block",
          }}
        />
      </div>
    </div>
  );
});

export default AvatarStreamer;
