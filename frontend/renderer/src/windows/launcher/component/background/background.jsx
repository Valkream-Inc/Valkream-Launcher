import React from "react";
import "./background.css";
import GltfBackground from "./gltf-background/gltf-background.jsx";
import ImgBackground from "./img-background/img-background.jsx";
import VideoBackground from "./video-background/video-background.jsx";

import { useBackground } from "../../context/background.context.jsx";
import { useInfos } from "../../context/infos.context.jsx";

function Background() {
  const { backgroundType } = useBackground();
  const { isLoading } = useInfos();

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
