/**
 * @author Valkream Team
 * @license MIT-NC
 */

import React, { useMemo, memo } from "react";
import { useBackground } from "../../../context/background.context.jsx";
import { useGames } from "../../../context/games.context.jsx";

function VideoBackground({ style }) {
  const { actualGame } = useGames();
  const { VideoBackgroundRef, backgroundType, isMuted } = useBackground();

  // Calcule dynamiquement le chemin source selon le type et le jeu
  const { src, type, Tag } = useMemo(() => {
    if (backgroundType === "video") {
      return {
        src: `./videos/${actualGame}-trailer.mp4`,
        type: "video/mp4",
        Tag: "video",
      };
    }
    return {
      src: `./audios/${actualGame}-song.mp3`,
      type: "audio/mpeg",
      Tag: "audio",
    };
  }, [backgroundType, actualGame]);

  // Options communes pour les balises <video> et <audio>
  const commonProps = useMemo(
    () => ({
      ref: VideoBackgroundRef,
      muted: isMuted,
      autoPlay: true,
      loop: true,
    }),
    [VideoBackgroundRef, isMuted]
  );

  // Rendu unique, propre et maintenable
  return (
    <Tag
      {...commonProps}
      style={Tag === "video" ? style : undefined}
      className={Tag === "video" ? "background" : undefined}
      playsInline={Tag === "video"}
    >
      {Tag === "video" && <source src={src} type={type} />}
      {Tag === "audio" && <source src={src} type={type} />}
    </Tag>
  );
}

export default memo(VideoBackground);
