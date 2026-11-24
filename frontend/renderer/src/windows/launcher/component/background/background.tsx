/**
 * @author Valkream Team
 * @license MIT-NC
 */

import { lazy, Suspense } from "react";

import "./background.css";
import ImgBackground from "./img-background/img-background";
import VideoBackground from "./video-background/video-background";

// three.js / drei sont lourds : chargés seulement si le fond 3D est choisi
const GltfBackground = lazy(() => import("./gltf-background/gltf-background"));

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
      {backgroundType === "3d" && (
        <Suspense fallback={null}>
          <GltfBackground />
        </Suspense>
      )}
    </>
  );
}

export default Background;
