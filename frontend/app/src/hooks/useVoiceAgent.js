import { useEffect, useRef } from "react";
import { loadPreferredVoice } from "../utils/speechUtils";
import * as SpeechSDK from "microsoft-cognitiveservices-speech-sdk";

export const useVoiceAgent = ({ aiSpeaking, setAiSpeaking }) => {
  const preferredVoiceRef = useRef(null);
  const isSpeakingRef = useRef(false);
  const avatarRef = useRef(null); // ✅ Added avatarRef

  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        preferredVoiceRef.current = loadPreferredVoice();
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
      window.speechSynthesis.cancel();
    };
  }, []);

  const speakWithPromise = (text, voice) => {
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.cancel();

    if (voice) utterance.voice = voice;

    return new Promise((resolve) => {
      utterance.onstart = () => {
        console.log("🟢 Browser TTS started");
        setAiSpeaking(true);
        isSpeakingRef.current = true;
        window._isSpeakingGlobal = true;
      };
      utterance.onend = () => {
        console.log("✅ Browser TTS finished");
        setAiSpeaking(false);
        isSpeakingRef.current = false;
        window._isSpeakingGlobal = false;
        resolve();
      };
      utterance.onerror = (e) => {
        console.error("❌ Browser TTS error:", e);
        setAiSpeaking(false);
        isSpeakingRef.current = false;
        window._isSpeakingGlobal = false;
        resolve();
      };

      window.speechSynthesis.speak(utterance);
    });
  };

  const speakWithAzureTTS = async (text) => {
    try {
      console.log("🟢 Azure TTS started with text:", text);
      const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(
        "FWDysIfDsO6UuFFklkHI7u2245j4fc55EUEu9xFxD07DfD8IEQupJQQJ99BCACHYHv6XJ3w3AAAAACOG8Xn6",
        "eastus2"
      );
      speechConfig.speechSynthesisLanguage = "en-US";
      speechConfig.speechSynthesisVoiceName = "en-US-AriaNeural";
      speechConfig.speechSynthesisOutputFormat =
        SpeechSDK.SpeechSynthesisOutputFormat.Audio16Khz32KBitRateMonoMp3;

      const player = new SpeechSDK.SpeakerAudioDestination();
      player.onAudioEnd = () => {
        console.log("🔚 Azure audio playback finished");
        setAiSpeaking(false);
        isSpeakingRef.current = false;
        window._isSpeakingGlobal = false;
        if (window.resumeRecognitionAsync) {
          window.resumeRecognitionAsync();
        }
      };

      const audioConfig = SpeechSDK.AudioConfig.fromSpeakerOutput(player);
      const synthesizer = new SpeechSDK.SpeechSynthesizer(
        speechConfig,
        audioConfig
      );

      return new Promise((resolve, reject) => {
        synthesizer.speakTextAsync(
          text,
          (result) => {
            if (
              result.reason ===
              SpeechSDK.ResultReason.SynthesizingAudioCompleted
            ) {
              console.log("✅ Azure TTS finished");
              synthesizer.close();
              resolve();
            } else {
              console.error("❌ Azure TTS failed:", result);
              synthesizer.close();
              reject(new Error("Azure TTS failed"));
            }
          },
          (error) => {
            console.error("❌ Azure TTS error:", error);
            synthesizer.close();
            reject(error);
          }
        );
      });
    } catch (error) {
      console.error("❌ Azure TTS fallback error:", error);
      return speakWithPromise(text, preferredVoiceRef.current);
    }
  };

  const speakText = async (text) => {
    console.log("🎤 speakText called with:", text);
    if (!text || text.trim() === "" || window._isSpeakingGlobal) return;

    window._isSpeakingGlobal = true;
    isSpeakingRef.current = true;
    setAiSpeaking(true);

    if (window.stopRecognitionAsync) {
      try {
        await window.stopRecognitionAsync();
      } catch (err) {
        console.error("Error stopping recognition:", err);
      }
    }

    try {
      await speakWithAzureTTS(text);
    } catch {
      console.warn("Fallback to browser TTS");
      await speakWithPromise(text, preferredVoiceRef.current);
    }
  };

  const stopSpeaking = () => {
    console.log("🛑 Forcing stopSpeaking");

    window.speechSynthesis.cancel();

    isSpeakingRef.current = false;
    setAiSpeaking(false);
    window._isSpeakingGlobal = false;

    if (window.resumeRecognitionAsync) {
      try {
        window.resumeRecognitionAsync();
      } catch (err) {
        console.error("Error resuming recognition after stop:", err);
      }
    }
  };

  return {
    speakText,
    stopSpeaking,
    isSpeakingRef,
    avatarRef, // ✅ Return it just like the old version
  };
};

export default useVoiceAgent;
