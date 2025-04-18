import Editor from "@monaco-editor/react";
import React, { useState, useRef, useEffect } from "react";
import styles from "./CodeEditorPanel.module.css";

const CodeEditorPanel = ({
  onCodeChange,
  initialCode = "",
  language: initialLang = "javascript",
  options = {},
}) => {
  const [code, setCode] = useState(initialCode);
  const [language, setLanguage] = useState(initialLang);
  const [fontSize, setFontSize] = useState(14);
  const editorRef = useRef(null);
  const resizeTimerRef = useRef(null);

  useEffect(() => {
    setCode(initialCode);
  }, [initialCode]);

  const handleEditorChange = (value) => {
    setCode(value);
    if (onCodeChange) onCodeChange(value, language);
  };

  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;
  };

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    if (onCodeChange) onCodeChange(code, newLang);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code).catch((err) => {
      console.error("Failed to copy code:", err);
    });
  };

  const handleSave = () => {
    const extensionMap = {
      javascript: "js",
      typescript: "ts",
      python: "py",
      java: "java",
      cpp: "cpp",
      csharp: "cs",
      html: "html",
      css: "css",
      json: "json",
      markdown: "md",
    };
    const ext = extensionMap[language] || "txt";
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `code.${ext}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleShare = () => {
    const encoded = encodeURIComponent(code);
    const shareUrl = `${window.location.origin}/share?lang=${language}&code=${encoded}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      alert("Shareable link copied to clipboard!");
    });
  };

  useEffect(() => {
    const handleResize = () => {
      if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current);
      resizeTimerRef.current = setTimeout(() => {
        if (editorRef.current) editorRef.current.layout();
      }, 100);
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(resizeTimerRef.current);
    };
  }, []);

  // Apply font size updates dynamically
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.updateOptions({ fontSize });
    }
  }, [fontSize]);

  const editorOptions = {
    automaticLayout: true,
    scrollBeyondLastLine: false,
    minimap: { enabled: false },
    fontSize,
    wordWrap: "on",
    wrappingIndent: "same",
    ...options,
  };

  return (
    <div className={styles.editorContainer}>
      <div className={styles.editorControls}>
        <div className={styles.controlsLeft}>
          <select
            className={styles.languageSelector}
            value={language}
            onChange={handleLanguageChange}
          >
            <option value="javascript">JavaScript</option>
            <option value="typescript">TypeScript</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
            <option value="csharp">C#</option>
            <option value="html">HTML</option>
            <option value="css">CSS</option>
            <option value="json">JSON</option>
            <option value="markdown">Markdown</option>
          </select>

          <div className={styles.fontSizeControl}>
            <span className={styles.fontSizeLabel}>Font Size:</span>
            <input
              type="range"
              min="10"
              max="24"
              value={fontSize}
              className={styles.fontSizeSlider}
              onChange={(e) => setFontSize(Number(e.target.value))}
            />
            <span className={styles.fontSizeLabel}>{fontSize}px</span>
          </div>
        </div>

        <div className={styles.controlsRight}>
          <button
            className={`${styles.editorControlButton} ${styles.copyButton}`}
            onClick={handleCopy}
          >
            📋 Copy
          </button>

          <button
            className={`${styles.editorControlButton} ${styles.saveButton}`}
            onClick={handleSave}
          >
            💾 Save
          </button>

          <button
            className={`${styles.editorControlButton} ${styles.shareButton}`}
            onClick={handleShare}
          >
            🔗 Share
          </button>
        </div>
      </div>

      <div className={styles.editorContent}>
        <Editor
          height="100%"
          language={language}
          value={code}
          theme="vs-dark"
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          options={editorOptions}
        />
      </div>
    </div>
  );
};

export default CodeEditorPanel;
