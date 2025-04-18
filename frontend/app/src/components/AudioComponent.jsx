import React, { useEffect, useState } from "react";
import * as SpeechSDK from "microsoft-cognitiveservices-speech-sdk";

const AudioTest = () => {
  const [testResult, setTestResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Simple method to test browser TTS
  const testBrowserTTS = async () => {
    setIsLoading(true);
    setTestResult("Testing browser TTS...");

    try {
      // Create test utterance
      const utterance = new SpeechSynthesisUtterance(
        "This is a test of the browser speech synthesis"
      );
      utterance.volume = 1.0;
      utterance.rate = 0.9;

      // Create a promise to track completion
      const speakPromise = new Promise((resolve, reject) => {
        utterance.onend = () => {
          setTestResult("Browser TTS completed successfully!");
          resolve();
        };

        utterance.onerror = (e) => {
          setTestResult(`Browser TTS failed: ${e.error}`);
          reject(e);
        };
      });

      // Start speaking
      window.speechSynthesis.speak(utterance);

      // Wait for completion
      await speakPromise;
    } catch (error) {
      setTestResult(`Browser TTS error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Test Azure TTS
  const testAzureTTS = async () => {
    setIsLoading(true);
    setTestResult("Testing Azure TTS...");

    try {
      // Configure speech service
      const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(
        "FWDysIfDsO6UuFFklkHI7u2245j4fc55EUEu9xFxD07DfD8IEQupJQQJ99BCACHYHv6XJ3w3AAAAACOG8Xn6",
        "eastus2"
      );

      // Configure parameters
      speechConfig.speechSynthesisLanguage = "en-US";
      speechConfig.speechSynthesisVoiceName = "en-US-AriaNeural";

      // Use default audio output
      const audioConfig = SpeechSDK.AudioConfig.fromDefaultSpeakerOutput();

      // Create synthesizer
      const synthesizer = new SpeechSDK.SpeechSynthesizer(
        speechConfig,
        audioConfig
      );

      // Create a promise to track completion
      const azurePromise = new Promise((resolve, reject) => {
        synthesizer.speakTextAsync(
          "This is a test of Azure Speech Services text to speech.",
          (result) => {
            if (
              result.reason ===
              SpeechSDK.ResultReason.SynthesizingAudioCompleted
            ) {
              setTestResult("Azure TTS completed successfully!");
              synthesizer.close();
              resolve();
            } else {
              setTestResult(`Azure TTS failed: ${result.errorDetails}`);
              synthesizer.close();
              reject(new Error(result.errorDetails));
            }
          },
          (error) => {
            setTestResult(`Azure TTS error: ${error}`);
            synthesizer.close();
            reject(error);
          }
        );
      });

      // Wait for completion
      await azurePromise;
    } catch (error) {
      setTestResult(`Azure TTS error: ${error.message || error}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Test both simple audio APIs
  const testAudioAPIs = async () => {
    setIsLoading(true);
    setTestResult("Testing basic audio capabilities...");

    try {
      // Test 1: Audio Context
      try {
        const audioContext = new (window.AudioContext ||
          window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // A4 note
        oscillator.connect(audioContext.destination);
        oscillator.start();

        await new Promise((resolve) => setTimeout(resolve, 500));

        oscillator.stop();
        audioContext.close();
        setTestResult("Audio Context API working!");
      } catch (audioContextError) {
        setTestResult(`Audio Context API failed: ${audioContextError.message}`);
        throw audioContextError;
      }

      // Test 2: HTML Audio Element
      try {
        const audio = new Audio();
        audio.src =
          "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA"; // Tiny WAV file

        const playPromise = audio.play();
        if (playPromise !== undefined) {
          await playPromise;
          setTestResult("Audio Element API working!");
        }
      } catch (audioElementError) {
        setTestResult(`Audio Element API failed: ${audioElementError.message}`);
      }
    } catch (error) {
      setTestResult(`Audio API tests failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Init check on mount
  useEffect(() => {
    // Check if speech synthesis is available
    if ("speechSynthesis" in window) {
      setTestResult("Speech synthesis is available in this browser.");
    } else {
      setTestResult("Speech synthesis is NOT available in this browser!");
    }
  }, []);

  return (
    <div
      style={{
        maxWidth: "600px",
        margin: "20px auto",
        padding: "20px",
        border: "1px solid #ccc",
        borderRadius: "8px",
      }}
    >
      <h2>Audio System Test</h2>

      <div style={{ marginBottom: "20px" }}>
        <p>
          <strong>Status:</strong> {testResult}
        </p>
        {isLoading && <p>Testing in progress...</p>}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <button
          onClick={testAudioAPIs}
          disabled={isLoading}
          style={{
            padding: "10px",
            backgroundColor: "#f0f0f0",
            cursor: isLoading ? "not-allowed" : "pointer",
          }}
        >
          Test Basic Audio APIs
        </button>

        <button
          onClick={testBrowserTTS}
          disabled={isLoading}
          style={{
            padding: "10px",
            backgroundColor: "#e0e0e0",
            cursor: isLoading ? "not-allowed" : "pointer",
          }}
        >
          Test Browser TTS
        </button>

        <button
          onClick={testAzureTTS}
          disabled={isLoading}
          style={{
            padding: "10px",
            backgroundColor: "#d0d0d0",
            cursor: isLoading ? "not-allowed" : "pointer",
          }}
        >
          Test Azure TTS
        </button>
      </div>

      <div style={{ marginTop: "20px" }}>
        <p>
          <strong>Troubleshooting Tips:</strong>
        </p>
        <ul>
          <li>Make sure your speakers are turned on and volume is up</li>
          <li>Check if other websites with audio are working</li>
          <li>Some browsers require user interaction before allowing audio</li>
          <li>Check browser permissions for audio playback</li>
          <li>Try clicking on the page first, then test again</li>
        </ul>
      </div>
    </div>
  );
};

export default AudioTest;
