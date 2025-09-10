import React from "react";
import "./background.css";
import ImgBackground from "./img-background/img-background.jsx";
import GltfBackground from "./gltf-background/gltf-background.jsx";
import VideoBackground from "./video-background/video-background.jsx";

import { useServerStatus } from "../../context/server-status.context.jsx";
import { useBackground } from "../../context/background.context.jsx";

function Background() {
  const { backgroundType } = useBackground();

  const { isLoading } = useServerStatus();

  return (
    <>
      {/* afficher l'image pendant le chargement de la video */}
      {backgroundType === "video" && !isLoading && <ImgBackground />}

      {/* Cas général */}
      {!isLoading && (
        <VideoBackground
          style={{ display: backgroundType === "video" ? "block" : "none" }}
        />
      )}
      {backgroundType === "image" && <ImgBackground />}
      {backgroundType === "3d" && <GltfBackground />}
    </>
  );
}

export default Background;
