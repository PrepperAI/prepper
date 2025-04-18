import * as SpeechSDK from "microsoft-cognitiveservices-speech-sdk";
import { useEffect, useRef, useState, useCallback } from "react";

const LiveTranscriber = ({ onFinalTranscript, aiSpeaking }) => {
  const [partial, setPartial] = useState("");
  const recognizerRef = useRef(null);
  const streamRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const isMountedRef = useRef(true);
  const processingRef = useRef({ isProcessing: false, timerId: null });
  const pendingTranscriptRef = useRef("");
  const lastRecognizedTimeRef = useRef(Date.now());
  const recognizedSegmentsRef = useRef([]);
  const lastFinalizedTranscriptRef = useRef("");
  const lastFinalizationTimeRef = useRef(0);
  const DUPLICATE_PREVENTION_WINDOW = 5000; // 5 seconds

  // Increased silence timeout - wait longer before finalizing
  const SILENCE_TIMEOUT = 5000; // 5 seconds of silence before finalizing
  const MAX_SEGMENTS_HISTORY = 5; // Keep track of last 5 segments

  const cleanup = useCallback(() => {
    if (recognizerRef.current) {
      try {
        recognizerRef.current.stopContinuousRecognitionAsync();
        recognizerRef.current.close();
      } catch (e) {
        console.error("Error closing recognizer:", e);
      }
      recognizerRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    setPartial("");
  }, []);

  const checkSentenceCompletion = (result) => {
    const text = result.text.trim();

    // Get the full pending transcript including this new result
    const fullText = pendingTranscriptRef.current.trim();

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
    // This is a softer check - only finalize if it seems like a complete thought AND there's been silence
    const timeSinceLastRecognition = Date.now() - lastRecognizedTimeRef.current;
    const wordCount = fullText.split(/\s+/).length;

    // If we have a substantial transcript (5+ words) with no incomplete markers,
    // and there's been significant silence, consider it complete
    if (wordCount >= 5 && timeSinceLastRecognition > SILENCE_TIMEOUT) {
      console.log(
        "Finalizing due to silence after substantial complete thought"
      );
      return true;
    }

    // DEFAULT CASE - When unsure, err on the side of incompleteness
    console.log(
      "No strong indicators of completion - continuing transcription"
    );
    return false;
  };

  const handleFinalTranscript = useCallback(
    (text) => {
      if (!isMountedRef.current || processingRef.current.isProcessing) return;

      // Prevent duplicate transmissions of the same transcript
      const now = Date.now();
      const timeSinceLastFinalization = now - lastFinalizationTimeRef.current;

      // Check if this is a duplicate of the last finalized transcript
      if (
        text === lastFinalizedTranscriptRef.current &&
        timeSinceLastFinalization < DUPLICATE_PREVENTION_WINDOW
      ) {
        console.log("Prevented duplicate transcript submission:", text);
        pendingTranscriptRef.current = ""; // Still clear the pending transcript
        recognizedSegmentsRef.current = []; // Reset segments history
        setPartial(""); // Clear the partial display
        return; // Don't send the duplicate
      }

      // This is a new transcript, proceed with finalization
      processingRef.current.isProcessing = true;

      if (processingRef.current.timerId) {
        clearTimeout(processingRef.current.timerId);
      }

      processingRef.current.timerId = setTimeout(() => {
        processingRef.current.isProcessing = false;
        processingRef.current.timerId = null;
      }, 1000);

      // Store this transcript and timestamp to prevent duplicates
      lastFinalizedTranscriptRef.current = text;
      lastFinalizationTimeRef.current = now;

      // Update UI and send the transcript
      setPartial("");
      onFinalTranscript(text);
      pendingTranscriptRef.current = ""; // Clear the pending transcript after finalizing
      recognizedSegmentsRef.current = []; // Reset segments history
    },
    [onFinalTranscript, DUPLICATE_PREVENTION_WINDOW]
  );

  const stopTranscription = useCallback(() => {
    if (!recognizerRef.current) return;

    try {
      // Check if there's any pending transcript before stopping
      if (pendingTranscriptRef.current.trim()) {
        handleFinalTranscript(pendingTranscriptRef.current.trim());
      }

      recognizerRef.current.stopContinuousRecognitionAsync(
        () => cleanup(),
        (err) => {
          console.error("Error stopping recognition:", err);
          cleanup();
        }
      );
    } catch (err) {
      console.error("Error during stop:", err);
      cleanup();
    }
  }, [cleanup, handleFinalTranscript]);

  const startTranscription = useCallback(async () => {
    if (!isMountedRef.current || aiSpeaking || recognizerRef.current) return;

    try {
      // Check for API keys
      if (
        !process.env.REACT_APP_AZURE_SPEECH_KEY ||
        !process.env.REACT_APP_AZURE_REGION
      ) {
        throw new Error("Azure Speech credentials not configured");
      }

      // Get microphone stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Create speech config
      const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(
        process.env.REACT_APP_AZURE_SPEECH_KEY,
        process.env.REACT_APP_AZURE_REGION
      );
      speechConfig.speechRecognitionLanguage = "en-US";

      // Increase silence timeouts to allow for more natural pauses
      speechConfig.setProperty(
        "SpeechServiceConnection_InitialSilenceTimeoutMs",
        "10000" // Increased to 10 seconds
      );
      speechConfig.setProperty(
        "SpeechServiceConnection_EndSilenceTimeoutMs",
        "3000" // Increased to 3 seconds
      );

      // Create audio config and recognizer
      const audioConfig = SpeechSDK.AudioConfig.fromStreamInput(stream);
      const recognizer = new SpeechSDK.SpeechRecognizer(
        speechConfig,
        audioConfig
      );
      recognizerRef.current = recognizer;

      // Set up event handlers
      recognizer.recognizing = (_, e) => {
        if (!isMountedRef.current || aiSpeaking) return;

        // Update the UI with current recognition (doesn't affect final transcript)
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = setTimeout(() => {
          if (isMountedRef.current) {
            // Show both pending transcript and current recognition
            const currentlyRecognizing = e.result.text.trim();
            if (currentlyRecognizing) {
              if (pendingTranscriptRef.current) {
                setPartial(
                  `${pendingTranscriptRef.current} ${currentlyRecognizing}`
                );
              } else {
                setPartial(currentlyRecognizing);
              }
            }
          }
        }, 50);
      };

      recognizer.recognized = (_, e) => {
        if (!isMountedRef.current || aiSpeaking) return;

        if (e.result.reason === SpeechSDK.ResultReason.RecognizedSpeech) {
          const recognizedText = e.result.text.trim();
          lastRecognizedTimeRef.current = Date.now();

          if (recognizedText && recognizedText.length > 1) {
            // Check if this is a repetition of previous segments
            const isRepetition = recognizedSegmentsRef.current.some(
              (segment) => {
                // Check if this segment is already contained in or very similar to our pending transcript
                return (
                  pendingTranscriptRef.current.includes(segment) &&
                  (recognizedText.includes(segment) ||
                    segment.includes(recognizedText))
                );
              }
            );

            // Update our history of recognized segments
            recognizedSegmentsRef.current.push(recognizedText);
            if (recognizedSegmentsRef.current.length > MAX_SEGMENTS_HISTORY) {
              recognizedSegmentsRef.current.shift(); // Remove oldest segment
            }

            // Only add to the pending transcript if it's not a repetition
            if (!isRepetition) {
              // Check if this adds meaningful new content
              const currentWords = pendingTranscriptRef.current
                .split(/\s+/)
                .filter((w) => w.length > 0);
              const newWords = recognizedText
                .split(/\s+/)
                .filter((w) => w.length > 0);

              // Debug info to help diagnose issues
              console.log(`Adding text: "${recognizedText}"`);
              console.log(
                `Current transcript: "${pendingTranscriptRef.current}"`
              );

              // Try to be smarter about how we append text
              if (pendingTranscriptRef.current) {
                // Check for different patterns of overlap to make a clean join
                const lastFewWords = currentWords
                  .slice(-3)
                  .join(" ")
                  .toLowerCase();
                const firstFewWords = newWords
                  .slice(0, 3)
                  .join(" ")
                  .toLowerCase();

                // If there's a clean overlap at the boundary, trim appropriately
                if (
                  lastFewWords &&
                  firstFewWords &&
                  (lastFewWords.includes(firstFewWords) ||
                    firstFewWords.includes(lastFewWords))
                ) {
                  console.log(
                    "Detected overlap at boundary, trimming for clean join"
                  );
                  // Find where to start appending to avoid duplication
                  let overlapIndex = 0;
                  for (let i = 0; i < newWords.length; i++) {
                    const testSequence = newWords
                      .slice(0, i + 1)
                      .join(" ")
                      .toLowerCase();
                    if (lastFewWords.endsWith(testSequence)) {
                      overlapIndex = i + 1;
                    }
                  }

                  // Only append words after the overlap
                  if (overlapIndex > 0 && overlapIndex < newWords.length) {
                    pendingTranscriptRef.current +=
                      " " + newWords.slice(overlapIndex).join(" ");
                  } else if (
                    !pendingTranscriptRef.current.endsWith(recognizedText)
                  ) {
                    // Default case if overlap detection didn't help
                    pendingTranscriptRef.current += " " + recognizedText;
                  }
                } else {
                  // No overlap detected, just make sure we're not duplicating
                  if (!pendingTranscriptRef.current.endsWith(recognizedText)) {
                    pendingTranscriptRef.current += " " + recognizedText;
                  }
                }
              } else {
                pendingTranscriptRef.current = recognizedText;
              }
            } else {
              console.log(
                `Repetition detected, not adding: "${recognizedText}"`
              );
            }

            // Create a result object to check completion
            const result = { text: pendingTranscriptRef.current };

            // Check if the sentence is complete
            if (checkSentenceCompletion(result)) {
              // If complete, send the final transcript and reset history
              handleFinalTranscript(pendingTranscriptRef.current);
            } else {
              // Otherwise, just update the partial state for UI feedback
              setPartial(pendingTranscriptRef.current);

              // Set a longer timeout to eventually submit if no new speech is detected
              clearTimeout(debounceTimerRef.current);
              debounceTimerRef.current = setTimeout(() => {
                if (isMountedRef.current && pendingTranscriptRef.current) {
                  // Double-check if it's complete before finalizing
                  const finalResult = { text: pendingTranscriptRef.current };
                  if (checkSentenceCompletion(finalResult)) {
                    handleFinalTranscript(pendingTranscriptRef.current);
                  }
                }
              }, SILENCE_TIMEOUT); // Wait for silence before considering finalization
            }
          }
        }
      };

      recognizer.canceled = (_, e) => {
        if (isMountedRef.current) {
          console.log("Recognition canceled:", e.reason);
          // Submit any pending transcript before cleanup
          if (pendingTranscriptRef.current) {
            handleFinalTranscript(pendingTranscriptRef.current);
          }
          cleanup();
        }
      };

      recognizer.sessionStopped = () => {
        if (isMountedRef.current) {
          console.log("Recognition session stopped");
          // Submit any pending transcript before cleanup
          if (pendingTranscriptRef.current) {
            handleFinalTranscript(pendingTranscriptRef.current);
          }
          cleanup();
        }
      };

      // Debug log to track performance and identify issues
      console.log("Recognition settings configured:", {
        silenceTimeouts: {
          initial: "10000ms",
          end: "3000ms",
          finalizeAfter: `${SILENCE_TIMEOUT}ms`,
        },
        segmentHistory: {
          maxSize: MAX_SEGMENTS_HISTORY,
        },
      });

      // Start recognition
      recognizer.startContinuousRecognitionAsync(
        () => {
          console.log("Recognition started");
          // Clear history when starting a new recognition session
          recognizedSegmentsRef.current = [];
          pendingTranscriptRef.current = "";
        },
        (error) => {
          console.error("Failed to start recognition:", error);
          cleanup();

          if (error.name === "NotAllowedError") {
            alert("Please allow microphone access to use voice recognition.");
          }
        }
      );
    } catch (err) {
      console.error("Error starting transcription:", err);
      cleanup();

      if (err.name === "NotAllowedError") {
        alert("Please allow microphone access to use voice recognition.");
      }
    }
  }, [aiSpeaking, cleanup, handleFinalTranscript]);

  // Initial setup
  useEffect(() => {
    isMountedRef.current = true;

    if (!aiSpeaking) {
      startTranscription();
    }

    return () => {
      isMountedRef.current = false;

      // Submit any pending transcript before unmounting
      if (pendingTranscriptRef.current) {
        handleFinalTranscript(pendingTranscriptRef.current);
      }

      cleanup();
    };
  }, [aiSpeaking, cleanup, startTranscription, handleFinalTranscript]);

  // React to changes in aiSpeaking
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (aiSpeaking) {
        // If AI starts speaking, finalize any pending transcription
        if (pendingTranscriptRef.current) {
          handleFinalTranscript(pendingTranscriptRef.current);
        }
        stopTranscription();
      } else {
        startTranscription();
      }
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [
    aiSpeaking,
    startTranscription,
    stopTranscription,
    handleFinalTranscript,
  ]);

  return null;
};

export default LiveTranscriber;
