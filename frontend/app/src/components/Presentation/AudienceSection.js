import React from "react";
import AvatarBox from "./AvatarBox";
import ChatBox from "./ChatBox";
import styles from "./AudienceSection.module.css";

const AudienceSection = () => {
  return (
    <div className={styles.container}>
      <div className={styles.avatars}>
        <AvatarBox name="AI Assistant" isActive />
        <AvatarBox name="Sam" />
        <AvatarBox name="Lina" />
        <AvatarBox name="Raj" />
        <AvatarBox name="Julia" />
      </div>

      <div className={styles.chat}>
        <ChatBox />
      </div>
    </div>
  );
};

export default AudienceSection;
