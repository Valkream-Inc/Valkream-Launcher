import React from "react";
import "./video-background.css";

import { useServerStatus } from "../../context/server-status.context.jsx";
import { useVideoBackground } from "../../context/video-background.context.jsx";
import GLTFViewer from "../3d-background/3d-background.jsx";

function VideoBackground() {
  const { VideoBackgroundRef } = useVideoBackground();
  const { isLoading } = useServerStatus();

  if (isLoading) return null;

  return (
    <>
      <video
        style={{ display: "none" }}
        // className="video-background"
        ref={VideoBackgroundRef}
        autoPlay
        loop
        playsInline
      >
        <source src="/videos/background.mp4" type="video/mp4" />
      </video>
      <GLTFViewer modelPath="/models/valheim_black_forest.glb" />
    </>
  );
}

export default VideoBackground;
