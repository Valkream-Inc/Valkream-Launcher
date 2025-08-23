import React from "react";
import "./video-background.css";

import { useVideoBackground } from "../../context/video-background.context.jsx";

function VideoBackground() {
  const { videoRef } = useVideoBackground();

  return (
    <video
      className="video-background"
      ref={videoRef}
      autoPlay
      loop
      playsInline
    >
      <source
        src={`${process.env.PUBLIC_URL}/videos/background.mp4`}
        type="video/mp4"
      />
    </video>
  );
}

export default VideoBackground;
