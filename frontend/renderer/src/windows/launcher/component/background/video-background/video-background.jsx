import React from "react";

import { useBackground } from "../../../context/background.context.jsx";
import { useGames } from "../../../context/games.context.jsx";

function VideoBackground({ style }) {
  const { actualGame } = useGames();
  const { VideoBackgroundRef, backgroundType, isMuted } = useBackground();

  if (backgroundType === "video")
    return (
      <>
        {actualGame === "Valheim" && (
          <video
            style={style}
            className="background"
            ref={VideoBackgroundRef}
            muted={isMuted}
            autoPlay
            loop
            playsInline
          >
            <source src={`./videos/Valheim-trailer.mp4`} type="video/mp4" />
          </video>
        )}
        {actualGame === "SevenDtoD" && (
          <video
            style={style}
            className="background"
            ref={VideoBackgroundRef}
            muted={isMuted}
            autoPlay
            loop
            playsInline
          >
            <source src={`./videos/SevenDtoD-trailer.mp4`} type="video/mp4" />
          </video>
        )}
      </>
    );
  else
    return (
      <audio
        src={`./audios/${actualGame}-song.mp3`}
        muted={isMuted}
        ref={VideoBackgroundRef}
        autoPlay
        loop
      />
    );
}

export default VideoBackground;
