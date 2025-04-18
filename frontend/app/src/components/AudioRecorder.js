import { useState, useRef } from "react";

const AudioRecorder = ({ onTranscribe }) => {
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorderRef.current = new MediaRecorder(stream);

    mediaRecorderRef.current.ondataavailable = (event) => {
      audioChunksRef.current.push(event.data);
    };

    mediaRecorderRef.current.onstop = async () => {
      const webmBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
      const wavBlob = await convertWebMToWav(webmBlob);

      // Download WAV (optional)
      const url = URL.createObjectURL(wavBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "recording.wav";
      a.click();
      URL.revokeObjectURL(url);

      try {
        // 🔹 1. Send to /transcribe
        const formData = new FormData();
        formData.append("file", wavBlob, "recording.wav");

        const transcriptionRes = await fetch(
          "http://127.0.0.1:8000/api/transcribe",
          {
            method: "POST",
            body: formData,
          }
        );

        const { transcription } = await transcriptionRes.json();
        console.log("Transcript:", transcription);

        // 🔹 2. Send to /interview with transcript
        const interviewRes = await fetch(
          "http://127.0.0.1:8000/api/interview",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              session_id: "demo-session", // or generate a UUID
              message: transcription,
              role: "Software Engineer",
              interview_type: "Behavioral",
              experience_level: "Entry",
              parsed_resume: "", // optional, can load from a resume upload
            }),
          }
        );

        const { response: gptReply } = await interviewRes.json();
        console.log("GPT:", gptReply);

        // 🔊 3. Speak response out loud (TTS)
        const utterance = new SpeechSynthesisUtterance(gptReply);
        speechSynthesis.speak(utterance);

        // Optional: Pass GPT response to parent
        onTranscribe(transcription, gptReply);
      } catch (err) {
        console.error("Error in audio flow:", err);
      }
    };

    audioChunksRef.current = [];
    mediaRecorderRef.current.start();
    setRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current.stop();
    setRecording(false);
  };

  const convertWebMToWav = async (webmBlob) => {
    const arrayBuffer = await webmBlob.arrayBuffer();
    const audioContext = new AudioContext();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    const wavBuffer = encodeWAV(audioBuffer);
    return new Blob([wavBuffer], { type: "audio/wav" });
  };

  const encodeWAV = (audioBuffer) => {
    const numChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const samples = audioBuffer.getChannelData(0); // Mono
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);

    function writeString(view, offset, string) {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    }

    // RIFF chunk descriptor
    writeString(view, 0, "RIFF");
    view.setUint32(4, 36 + samples.length * 2, true);
    writeString(view, 8, "WAVE");

    // FMT sub-chunk
    writeString(view, 12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM format
    view.setUint16(22, 1, true); // Mono
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true); // byteRate
    view.setUint16(32, 2, true); // blockAlign
    view.setUint16(34, 16, true); // bitsPerSample

    // data sub-chunk
    writeString(view, 36, "data");
    view.setUint32(40, samples.length * 2, true);

    // PCM samples
    let offset = 44;
    for (let i = 0; i < samples.length; i++, offset += 2) {
      const s = Math.max(-1, Math.min(1, samples[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }

    return buffer;
  };

  return (
    <div>
      <button onClick={recording ? stopRecording : startRecording}>
        {recording ? "Stop Recording" : "Start Recording"}
      </button>
    </div>
  );
};

export default AudioRecorder;
