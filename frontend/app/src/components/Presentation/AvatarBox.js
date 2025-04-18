import React from "react";
import styles from "./AvatarBox.module.css";

const AvatarBox = ({ name, isActive }) => {
  return (
    <div className={`${styles.avatarBox} ${isActive ? styles.active : ""}`}>
      <div className={styles.avatarImage}>
        {/* You can replace this with D-ID video or image */}
        <img src={`https://robohash.org/${name}.png`} alt={name} />
      </div>
      <div className={styles.name}>{name}</div>
    </div>
  );
};

export default AvatarBox;
