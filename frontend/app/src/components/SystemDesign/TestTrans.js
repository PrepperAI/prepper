import React, { useState, useRef, useCallback, useEffect } from "react";
import * as SpeechSDK from "microsoft-cognitiveservices-speech-sdk";

// Sentence completion checker
const checkSentenceCompletion = (result) => {
  const fullText = result.trim();

  // FIRST TIER - Fundamental structural incompleteness

  // Check for incomplete conjunctions at the end
  const hasConjunctionAtEnd =
    /\b(and|but|or|because|so|if|while|although|since|though|unless|whereas|yet)[\s\.,!?]*$/.test(
      fullText
    );
  if (hasConjunctionAtEnd) {
    console.log("Incomplete sentence detected (ends with conjunction)");
    return false;
  }

  // Check for trailing prepositions
  const endsWithPreposition =
    /\b(in|on|at|to|with|of|from|for|by|about|above|across|after|against|along|among|around|before|behind|below|beneath|beside|between|beyond|during|except|inside|into|near|off|onto|outside|over|through|throughout|toward|towards|under|underneath|until|upon|within|without)[\s\.,!?]*$/.test(
      fullText
    );
  if (endsWithPreposition) {
    console.log("Incomplete sentence detected (ends with preposition)");
    return false;
  }

  // Check for trailing articles or determiners
  const endsWithDeterminer =
    /\b(a|an|the|this|that|these|those|my|your|his|her|its|our|their|some|any|every|each|either|neither|both|much|many|more|most|few|fewer|all|no)[\s\.,!?]*$/.test(
      fullText
    );
  if (endsWithDeterminer) {
    console.log("Incomplete sentence detected (ends with determiner)");
    return false;
  }

  // SECOND TIER - Linguistic markers of incompleteness

  // Check for trailing filler phrases - expanded list
  const endsWithFiller =
    /\b(like|you know|I mean|um|uh|well|sort of|kind of|basically|literally|actually|anyway|so|just|right|okay|hmm|er|eh)[\s\.,!?]*$/.test(
      fullText
    );
  if (endsWithFiller) {
    console.log("Potentially incomplete sentence (ends with filler)");
    return false;
  }

  // Check for trailing question words
  const endsWithQuestionWord =
    /\b(who|what|where|when|why|how|which|whose|whom)[\s\.,]?(?!\?)*$/.test(
      fullText
    );
  if (endsWithQuestionWord) {
    console.log(
      "Incomplete sentence detected (ends with question word without question mark)"
    );
    return false;
  }

  // Check if the sentence ends with proper punctuation
  const endsWithPunctuation = /[.!?]$/.test(fullText);
  if (endsWithPunctuation) {
    console.log("Complete sentence detected (ends with punctuation)");
    return true;
  }

  // Additional check: Is this a complete thought without trailing indicators of more to come?
  const wordCount = fullText.split(/\s+/).length;

  // If we have a substantial transcript (5+ words) with no incomplete markers,
  // and there's been significant silence, consider it complete
  if (wordCount >= 5) {
    console.log("Finalizing due to silence after substantial complete thought");
    return true;
  }

  // DEFAULT CASE - When unsure, err on the side of incompleteness
  console.log("No strong indicators of completion - continuing transcription");
  return false;
};

export default function StreamlinedAzureTranscriber({
  onFinalTranscript,
  aiSpeaking = false,
  onWaitingChange = () => {},
}) {
  const [interimText, setInterimText] = useState("");
  const [buffer, setBuffer] = useState("");
  const [finalText, setFinalText] = useState("");
  const [error, setError] = useState(null);
  const [listening, setListening] = useState(false);

  const recognizerRef = useRef(null);
  const micStreamRef = useRef(null);
  const lastFinalizedRef = useRef("");
  const isCleaningUpRef = useRef(false);
  const waitingRef = useRef(false);

  const updateWaitingState = useCallback(
    (isWaiting) => {
      if (waitingRef.current !== isWaiting) {
        waitingRef.current = isWaiting;
        onWaitingChange(isWaiting);
      }
    },
    [onWaitingChange]
  );

  const finalizeTranscript = useCallback(
    (text) => {
      const cleaned = text.trim();
      if (!cleaned) return;
      lastFinalizedRef.current = cleaned.toLowerCase();
      setFinalText(cleaned);
      setBuffer("");
      onFinalTranscript?.(cleaned);
    },
    [onFinalTranscript]
  );

  const stopStream = useCallback(async () => {
    if (isCleaningUpRef.current) return;
    isCleaningUpRef.current = true;
    try {
      if (recognizerRef.current) {
        await new Promise((resolve) =>
          recognizerRef.current.stopContinuousRecognitionAsync(() => {
            try {
              recognizerRef.current.close();
            } catch {}
            recognizerRef.current = null;
            setListening(false);
            resolve();
          }, resolve)
        );
      }
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((track) => track.stop());
        micStreamRef.current = null;
      }
      setInterimText("");
    } catch (err) {
      console.error("Error during cleanup:", err);
    } finally {
      isCleaningUpRef.current = false;
    }
  }, []);

  const startStream = useCallback(async () => {
    if (listening || isCleaningUpRef.current) return;

    await stopStream(); // Ensure clean state
    setError(null);

    try {
      const key = process.env.REACT_APP_AZURE_SPEECH_KEY;
      const region = process.env.REACT_APP_AZURE_REGION;
      if (!key || !region) throw new Error("Azure credentials not set");

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;

      const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(key, region);
      speechConfig.speechRecognitionLanguage = "en-US";
      speechConfig.setProperty(
        SpeechSDK.PropertyId
          .SpeechServiceConnection_ContinuousRecognitionTimeout,
        "300000"
      );
      // Give user up to 10 sec to start speaking
      speechConfig.setProperty(
        SpeechSDK.PropertyId.SpeechServiceConnection_InitialSilenceTimeoutMs,
        "10000"
      );
      // Treat 3 sec of silence as end of utterance (if not using segmentation)
      speechConfig.setProperty(
        SpeechSDK.PropertyId.SpeechServiceConnection_EndSilenceTimeoutMs,
        "3000"
      );

      // 5) Time‑based segmentation
      speechConfig.setProperty(
        SpeechSDK.PropertyId.Speech_SegmentationStrategy,
        "Time"
      );
      // Finalize a segment after 2 sec of silence
      speechConfig.setProperty(
        SpeechSDK.PropertyId.Speech_SegmentationSilenceTimeoutMs,
        "1000"
      );
      // Or after 60 sec of talking, whichever comes first
      speechConfig.setProperty(
        SpeechSDK.PropertyId.Speech_SegmentationMaximumTimeMs,
        "60000"
      );

      const audioConfig = SpeechSDK.AudioConfig.fromStreamInput(stream);
      const recognizer = new SpeechSDK.SpeechRecognizer(
        speechConfig,
        audioConfig
      );
      recognizerRef.current = recognizer;

      recognizer.recognizing = (_, evt) => {
        if (!aiSpeaking) setInterimText(evt.result.text);
      };

      recognizer.recognized = (_, evt) => {
        if (aiSpeaking) return;
        if (evt.result.reason === SpeechSDK.ResultReason.RecognizedSpeech) {
          const current = evt.result.text.trim();
          if (current) {
            setBuffer((prev) => (prev ? `${prev} ${current}` : current));
            setInterimText("");
          }
        }
      };

      recognizer.canceled = (_, evt) => {
        if (evt.reason === SpeechSDK.CancellationReason.Error) {
          setError(`Transcription error: ${evt.errorDetails}`);
          stopStream();
        }
      };

      recognizer.sessionStopped = () => stopStream();

      recognizer.startContinuousRecognitionAsync(() => setListening(true));
    } catch (err) {
      console.error("Failed to start:", err);
      setError(err.message);
      stopStream();
    }
  }, [aiSpeaking, listening, stopStream]);

  useEffect(() => {
    startStream();
  }, [startStream, stopStream]);

  useEffect(() => {
    const cleaned = buffer.trim();
    const normalized = cleaned.toLowerCase();

    const wordCount = cleaned.split(/\s+/).filter(Boolean).length;

    const isComplete =
      cleaned &&
      checkSentenceCompletion(cleaned) &&
      normalized !== lastFinalizedRef.current &&
      wordCount > 1;

    if (isComplete) {
      finalizeTranscript(cleaned);
      updateWaitingState(false); // ✅ no longer waiting
    } else if (cleaned) {
      updateWaitingState(true); // 🕒 waiting for more input
    } else {
      updateWaitingState(false); // 🔄 reset to not waiting
    }
  }, [buffer, finalizeTranscript, updateWaitingState]);

  return (
    <div style={{ padding: 16, border: "1px solid #ccc", borderRadius: 8 }}>
      <button
        onClick={listening ? stopStream : startStream}
        style={{
          padding: "8px 16px",
          background: listening ? "#d44" : "#4a4",
          color: "#fff",
          border: "none",
          borderRadius: 4,
          cursor: "pointer",
        }}
      >
        {listening ? "Stop Streaming" : "Start Streaming"}
      </button>

      {error && <p style={{ color: "#d44" }}>{error}</p>}

      <div style={{ marginTop: 16 }}>
        <strong>Live (partial):</strong>
        <p style={{ fontStyle: "italic" }}>{interimText || "…"}</p>
      </div>

      <div style={{ marginTop: 16 }}>
        <strong>Transcript (finalized):</strong>
        <p>{finalText}</p>
      </div>
    </div>
  );
}
