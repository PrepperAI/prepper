import React, { useEffect, useRef, useState } from "react";
import styles from "./UserCameraPreview.module.css";
import { Camera, CameraOff } from "lucide-react";

const UserCameraPreview = ({ width = "100%", height = "100%" }) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [showCamera, setShowCamera] = useState(true);

  useEffect(() => {
    if (showCamera) {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => {
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch((err) => {
          console.error("🚫 Camera access error:", err);
        });
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [showCamera]);

  return (
    <div className={styles.previewContainer} style={{ width, height }}>
      {showCamera ? (
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className={styles.video}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        <div className={styles.placeholder}>Camera Off</div>
      )}
      <button
        onClick={() => setShowCamera((prev) => !prev)}
        className={styles.cameraToggle}
        title={showCamera ? "Turn off camera" : "Turn on camera"}
      >
        {showCamera ? <CameraOff size={20} /> : <Camera size={20} />}
      </button>
    </div>
  );
};

export default UserCameraPreview;
