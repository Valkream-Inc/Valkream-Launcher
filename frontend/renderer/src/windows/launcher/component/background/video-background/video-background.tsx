/**
 * @author Valkream Team
 * @license MIT-NC
 */

import { useMemo, memo } from "react";
import { useBackground } from "../../../context/background.context";
import { useGames } from "../../../context/games.context";
import type {
  VideoBackgroundProps,
  VideoBackgroundTag,
} from "./video-background.types";

function VideoBackground({ style }: VideoBackgroundProps) {
  const { actualGame } = useGames();
  const { VideoBackgroundRef, backgroundType, isMuted } = useBackground();

  // Calcule dynamiquement le chemin source selon le type et le jeu
  const { src, type, Tag } = useMemo((): {
    src: string;
    type: string;
    Tag: VideoBackgroundTag;
  } => {
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

  // <audio> partage les attributs média de <video> (ref, muted, autoPlay, loop)
  const MediaTag = Tag as "video";

  // Rendu unique, propre et maintenable
  return (
    <MediaTag
      {...commonProps}
      style={Tag === "video" ? style : undefined}
      className={Tag === "video" ? "background" : undefined}
      playsInline={Tag === "video"}
    >
      {Tag === "video" && <source src={src} type={type} />}
      {Tag === "audio" && <source src={src} type={type} />}
    </MediaTag>
  );
}

export default memo(VideoBackground);
