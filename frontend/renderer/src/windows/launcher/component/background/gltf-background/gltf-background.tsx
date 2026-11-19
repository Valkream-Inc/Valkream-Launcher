/**
 * @author Valkream Team
 * @license MIT-NC
 */

import "./gltf-background.css";

import { Suspense, useMemo, memo, useState, useCallback } from "react";
import type { MouseEvent } from "react";
import { Canvas } from "@react-three/fiber";
import { Stats } from "@react-three/drei";

import CampfireLight from "./component/campfire-light";
import LoaderFallback from "./component/loader-fallback";
import Model from "./component/model";
import PlayerControls from "./component/players-controls";

import { useGames } from "../../../context/games.context";

function GltfBackground() {
  const { actualInstance } = useGames();
  const { assets, gltf } = actualInstance;
  const [showStats, setShowStats] = useState(false);

  // ✅ Toggle avec Ctrl + Maj + clic (listener React sur le wrapper :
  // plus besoin de document.querySelector("canvas"), qui pouvait être
  // null au moment du useEffect)
  const handleClick = useCallback((e: MouseEvent<HTMLDivElement>) => {
    if (e.ctrlKey && e.shiftKey) {
      e.preventDefault();
      setShowStats((prev) => !prev);
    }
  }, []);

  // 📦 Données de la scène : décrites par la config render de l'instance
  const { camera, lights, fogArgs, environment, hasCampfire } = gltf;

  const [speed, climbSpeed] = useMemo(() => [4, 2], []);

  return (
    <div className="background" onClick={handleClick}>
      {/* "percentage" = PCFShadowMap : évite le warning PCFSoftShadowMap */}
      <Canvas shadows="percentage" camera={camera}>
        <ambientLight
          intensity={lights.ambientIntensity}
          color={lights.color}
        />
        <fog attach="fog" args={fogArgs} />
        {environment}
        {/* Fallback = null : rien de DOM dans le Canvas, c'est ça qui
            faisait planter React (unmount de root pendant un render) */}
        <Suspense fallback={null}>
          <Model key={assets} modelPath={`./models/${assets}-3d.glb`} />
        </Suspense>
        {hasCampfire && <CampfireLight />}
        <PlayerControls speed={speed} climbSpeed={climbSpeed} />
        {showStats && <Stats className="stats" />}
      </Canvas>

      {/* Loader HTML classique, en dehors du Canvas */}
      <LoaderFallback />
    </div>
  );
}

export default memo(GltfBackground);
