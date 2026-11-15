/**
 * @author Valkream Team
 * @license MIT-NC
 */

import "./gltf-background.css";

import { Suspense, useMemo, memo, useState, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import { Stats } from "@react-three/drei";

import CampfireLight from "./component/campfire-light";
import LoaderFallback from "./component/loader-fallback";
import Model from "./component/model";
import PlayerControls from "./component/players-controls";
import SunsetEnvironment from "./component/sunset-environement";

import { useGames } from "../../../context/games.context.jsx";

function GltfBackground() {
  const { actualGame } = useGames();
  const [showStats, setShowStats] = useState(false);

  // ✅ Toggle avec Ctrl + Maj + clic (listener React sur le wrapper :
  // plus besoin de document.querySelector("canvas"), qui pouvait être
  // null au moment du useEffect)
  const handleClick = useCallback((e) => {
    if (e.ctrlKey && e.shiftKey) {
      e.preventDefault();
      setShowStats((prev) => !prev);
    }
  }, []);

  // 📦 Données selon le jeu
  const ValheimData = useMemo(
    () => ({
      camera: { position: [0, 1.8, 4.5], fov: 75 },
      lights: { ambientIntensity: 0.4, color: "#ffffff" },
      fogArgs: ["#202030", 0, 50],
      environment: <SunsetEnvironment />,
      hasCampfire: true,
    }),
    [],
  );

  const SevenDtoDData = useMemo(
    () => ({
      camera: { position: [60, 60, 60], fov: 75 },
      lights: { ambientIntensity: 30, color: "#ffffff" },
      fogArgs: ["#202030", 0, 200],
      environment: null,
      hasCampfire: false,
    }),
    [],
  );

  const { camera, lights, fogArgs, environment, hasCampfire } = useMemo(() => {
    switch (actualGame) {
      case "SevenDtoD":
        return SevenDtoDData;
      case "Valheim":
      default:
        return ValheimData;
    }
  }, [actualGame, ValheimData, SevenDtoDData]);

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
          <Model key={actualGame} modelPath={`./models/${actualGame}-3d.glb`} />
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
