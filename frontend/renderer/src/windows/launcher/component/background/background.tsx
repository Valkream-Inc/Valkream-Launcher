/**
 * @author Valkream Team
 * @license MIT-NC
 */

import "./background.css";
import GltfBackground from "./gltf-background/gltf-background";
import ImgBackground from "./img-background/img-background";
import VideoBackground from "./video-background/video-background";

import { useBackground } from "../../context/background.context";
import { useInfos } from "../../context/infos.context";

function Background() {
  const { backgroundType } = useBackground();
  const { isLoading } = useInfos();

  return (
    <>
      {/* afficher l'image pendant le chargement*/}
      {isLoading && <ImgBackground />}

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
