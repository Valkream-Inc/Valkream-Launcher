import React from "react";
import "./video-background.css";

import { useVideoBackground } from "../../context/video-background.context.jsx";
import { useServerStatus } from "../../context/server-status.context.jsx";

function VideoBackground() {
  const { VideoBackgroundRef } = useVideoBackground();
  const { isLoading } = useServerStatus();

  if (isLoading) return null;

  return (
    <video
      className="video-background"
      ref={VideoBackgroundRef}
      autoPlay
      loop
      playsInline
    >
      <source src="/videos/background.mp4" type="video/mp4" />
    </video>
  );
}

export default VideoBackground;
