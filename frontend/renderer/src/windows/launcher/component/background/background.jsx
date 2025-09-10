import React from "react";
import "./background.css";
import ImgBackground from "./img-background/img-background.jsx";
import GltfBackground from "./gltf-background/gltf-background.jsx";
import VideoBackground from "./video-background/video-background.jsx";

import { useServerStatus } from "../../context/server-status.context.jsx";

function Background() {
  const { isLoading } = useServerStatus();
  if (isLoading) return null;

  const background_type = "video";

  return (
    <>
      <VideoBackground
        style={{ display: background_type === "video" ? "block" : "none" }}
      />
      {background_type === "image" && <ImgBackground />}
      {background_type === "3d" && <GltfBackground />}
    </>
  );
}

export default Background;
