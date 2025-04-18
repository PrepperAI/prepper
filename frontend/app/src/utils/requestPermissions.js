// utils/requestPermissions.js
export const requestMediaPermissions = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    // Stop the tracks since this is only for permission
    stream.getTracks().forEach((track) => track.stop());

    console.log("✅ Camera & Microphone access granted");
    return true;
  } catch (error) {
    console.error("❌ Permissions denied:", error);
    return false;
  }
};
