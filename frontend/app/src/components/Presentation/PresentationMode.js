import React, { useRef, useState } from "react";
import PDFViewer from "./PDFViewer";
import AudienceSection from "./AudienceSection";
import LiveTranscriber from "../LiveTranscriber";
import AvatarStreamer from "../AvatarStreamer";
import UserCameraPreview from "../UserCameraPreview";
import useVoiceAgent from "../../hooks/useVoiceAgent";
import styles from "./PresentationMode.module.css";
import { useUser } from "../../context/UserContext";

const audienceAvatars = [
  { name: "Lina" },
  { name: "Raj" },
  { name: "Sam" },
  { name: "Julia" },
];

const PresentationMode = () => {
  const { user } = useUser();
  const canvasRef = useRef(null);
  const [fileUrl, setFileUrl] = useState(null);
  const [fileName, setFileName] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [activeSpeaker, setActiveSpeaker] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [aiSpeaking, setAiSpeaking] = useState(false);

  const { speakText, avatarRef } = useVoiceAgent({ aiSpeaking, setAiSpeaking });

  // 🧠 Speech queue logic
  const speechQueue = useRef([]);
  const isSpeechProcessing = useRef(false);

  const processSpeechQueue = async () => {
    if (isSpeechProcessing.current || speechQueue.current.length === 0) return;
    isSpeechProcessing.current = true;

    while (speechQueue.current.length > 0) {
      const next = speechQueue.current.shift();
      try {
        console.log(`🔊 Speaking: ${next.text}`);
        await speakText(next.text);
      } catch (err) {
        console.error("❌ Speech error:", err);
      }
    }

    isSpeechProcessing.current = false;
  };

  const queueSpeech = (text) => {
    if (!text?.trim()) return;
    console.log("📋 Queued speech:", text);
    speechQueue.current.push({ text });
    processSpeechQueue();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const ext = file.name.split(".").pop().toLowerCase();
    setFileName(file.name);

    if (ext === "pdf") {
      const reader = new FileReader();
      reader.onload = () => setFileUrl(reader.result);
      reader.readAsDataURL(file);
    } else if (ext === "ppt" || ext === "pptx") {
      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch(
          "http://127.0.0.1:8000/api/upload-presentation",
          {
            method: "POST",
            body: formData,
          }
        );

        const blob = await res.blob();
        const pdfUrl = URL.createObjectURL(blob);
        setFileUrl(pdfUrl);
      } catch (err) {
        console.error("Error converting presentation:", err);
      }
    } else {
      alert("Unsupported file format. Please upload a PDF or PowerPoint file.");
    }
  };

  const getCurrentSlideImage = () => {
    if (!canvasRef.current) return null;
    return canvasRef.current.toDataURL("image/png");
  };

  const sendToAI = async (transcript) => {
    const slideImage = getCurrentSlideImage();
    console.log("vov efoj vlef;avlboevboefvpn ejfbvebvoefbv o", slideImage);

    const res = await fetch("http://127.0.0.1:8000/api/presentation/respond", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_uid: user?.uid || "guest",
        user_email: user?.email || "unknown",
        transcript,
        slideImage,
        currentPage,
      }),
    });

    const { message, avatarName } = await res.json();

    setActiveSpeaker(avatarName);
    setChatMessages((prev) => [
      ...prev,
      { sender: avatarName, content: message },
    ]);

    queueSpeech(message);
    setTimeout(() => setActiveSpeaker(null), 4000);
  };

  return (
    <div className={styles.wrapper}>
      {!fileUrl ? (
        <div className={styles.uploadContainer}>
          <input
            type="file"
            accept=".pdf,.ppt,.pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.ms-powerpoint"
            id="pdf-upload"
            className={styles.fileInput}
            onChange={handleFileChange}
          />
          <label htmlFor="pdf-upload" className={styles.uploadButton}>
            {fileName || "No file chosen"}
          </label>
          <span className={styles.uploadText}>Upload PDF or PowerPoint</span>
        </div>
      ) : (
        <div className={styles.presentationLayout}>
          <div className={styles.slideArea}>
            <div className={styles.cameraOverlay}>
              <UserCameraPreview />
            </div>

            <PDFViewer
              fileUrl={fileUrl}
              fileName={fileName}
              onReupload={() => {
                setFileUrl(null);
                setFileName("");
              }}
              canvasRef={canvasRef} // ✅ this is now passed down
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
            />

            <LiveTranscriber
              onFinalTranscript={sendToAI}
              aiSpeaking={aiSpeaking}
            />
          </div>

          <div className={styles.audienceArea}>
            <div className={styles.cameraAndAvatarStack}>
              <UserCameraPreview />
              <div className={styles.avatarOverlay}>
                <AvatarStreamer ref={avatarRef} />
              </div>
            </div>
            <AudienceSection
              chatMessages={chatMessages}
              avatars={audienceAvatars}
              activeSpeaker={activeSpeaker}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PresentationMode;
