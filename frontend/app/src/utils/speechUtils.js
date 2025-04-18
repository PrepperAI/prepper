// utils/speechUtils.js
export const loadPreferredVoice = () => {
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find(
      (v) =>
        v.name.toLowerCase().includes("natural") &&
        v.lang.toLowerCase().includes("en-us")
    ) ||
    voices.find(
      (v) =>
        v.name.toLowerCase().includes("google") &&
        v.lang.toLowerCase().includes("en-us")
    ) ||
    voices.find((v) => v.lang.toLowerCase().includes("en-us")) ||
    voices[0]
  );
};

export const speakWithFallback = (text, voice) => {
  return new Promise((resolve) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = voice;
    utterance.onend = resolve;
    speechSynthesis.speak(utterance);
  });
};
