import React, { useState } from "react";
import styles from "./ChatBox.module.css";

const dummyAudience = ["Sam", "Lina", "Raj", "Julia"];

const ChatBox = () => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);

  const sendMessage = () => {
    if (!input.trim()) return;

    const userMessage = {
      role: "user",
      content: input.trim(),
      senderName: "You",
    };

    const randomResponder =
      dummyAudience[Math.floor(Math.random() * dummyAudience.length)];

    const aiMessage = {
      role: "assistant",
      content: "Thanks for the question! Here's what I think...",
      senderName: randomResponder,
    };

    setMessages((prev) => [...prev, userMessage, aiMessage]);
    setInput("");
  };

  return (
    <div className={styles.chatBox}>
      <div className={styles.messages}>
        {messages.map((msg, i) => (
          <div
            key={i}
            className={
              msg.role === "user"
                ? styles.userMsgWrapper
                : styles.assistantMsgWrapper
            }
          >
            <div className={styles.senderName}>{msg.senderName}</div>
            <div
              className={
                msg.role === "user" ? styles.userMsg : styles.assistantMsg
              }
            >
              {msg.content}
            </div>
          </div>
        ))}
      </div>

      <div className={styles.inputArea}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Type a message..."
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
};

export default ChatBox;
