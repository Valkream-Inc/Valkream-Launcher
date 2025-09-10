import React from "react";

import { useVideoBackground } from "../../../context/video-background.context.jsx";

function VideoBackground({ style }) {
  const { VideoBackgroundRef } = useVideoBackground();

  return (
    <>
      <video
        style={style}
        className="background"
        ref={VideoBackgroundRef}
        autoPlay
        loop
        playsInline
      >
        <source src="/videos/background.mp4" type="video/mp4" />
      </video>
    </>
  );
}

export default VideoBackground;
