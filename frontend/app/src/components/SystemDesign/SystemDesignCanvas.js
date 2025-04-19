import React, { useEffect } from "react";
import { Excalidraw } from "@excalidraw/excalidraw";
import styles from "./SystemDesignCanvas.module.css";
// import "@excalidraw/excalidraw/dist/excalidraw.css"; //dont import this ever again

const SystemDesignCanvas = ({ canvasRef }) => {
  // Ensure canvasRef exposes getSceneElements method
  return (
    <div className={styles.canvasContainer}>
      <div className={styles.excalidrawWrapper}>
        <Excalidraw
          ref={canvasRef}
          initialData={{
            elements: [
              {
                type: "text",
                version: 1,
                versionNonce: 12345,
                isDeleted: false,
                id: "init-text",
                fillStyle: "hachure",
                strokeWidth: 1,
                strokeStyle: "#ffffff", // Already white, which is good
                backgroundColor: "transparent",
                x: 100,
                y: 100,
                width: 300,
                height: 50,
                angle: 0,
                text: "Start designing your system here...",
                fontSize: 24,
                fontFamily: 2, // 1 = Virgil, 2 = Helvetica
                textAlign: "left",
                verticalAlign: "top",
                baseline: 40,
                fontColor: "#ffffff", // Add this line to ensure text is white
                opacity: 100, // Ensure full opacity
              },
            ],
            appState: {
              theme: "dark",
              zoom: {
                value: 1.3, // Zoom level
              },
            },
          }}
          UIOptions={{
            canvasActions: {
              loadScene: false,
              saveScene: false,
              export: false,
              clearCanvas: false,
              changeViewBackgroundColor: false,
            },
            tools: {
              image: false,
            },
            helpButton: false, // Add this to remove the question mark
            libraryButton: false,
          }}
          theme="dark" // Set to dark theme to match the interface
          viewModeEnabled={false}
        />
      </div>
    </div>
  );
};

export default SystemDesignCanvas;
