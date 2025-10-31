/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

import "./gltf-background.css";

import React, {
  Suspense,
  useMemo,
  memo,
  useState,
  useCallback,
  useEffect,
} from "react";
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

  // ✅ Toggle avec Ctrl + Maj + clic sur le Canvas
  const handleCanvasClick = useCallback((e) => {
    if (e.ctrlKey && e.shiftKey) {
      e.preventDefault();
      setShowStats((prev) => !prev);
    }
  }, []);

  useEffect(() => {
    // On ajoute le listener une fois que le canvas est dans le DOM
    const canvas = document.querySelector("canvas");
    if (!canvas) return;
    canvas.addEventListener("click", handleCanvasClick);
    return () => canvas.removeEventListener("click", handleCanvasClick);
  }, [handleCanvasClick]);

  // 📦 Données selon le jeu
  const ValheimData = useMemo(
    () => ({
      camera: { position: [0, 1.8, 4.5], fov: 75 },
      lights: { ambientIntensity: 0.4, color: "#ffffff" },
      fogArgs: ["#202030", 0, 50],
      environment: <SunsetEnvironment />,
      hasCampfire: true,
    }),
    []
  );

  const SevenDtoDData = useMemo(
    () => ({
      camera: { position: [60, 60, 60], fov: 75 },
      lights: { ambientIntensity: 30, color: "#ffffff" },
      fogArgs: ["#202030", 0, 200],
      environment: null,
      hasCampfire: false,
    }),
    []
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
    <div className="background">
      <Canvas shadows camera={camera}>
        <ambientLight
          intensity={lights.ambientIntensity}
          color={lights.color}
        />
        <fog attach="fog" args={fogArgs} />
        {environment}
        <Suspense fallback={<LoaderFallback />}>
          <Model modelPath={`./models/${actualGame}-3d.glb`} />
        </Suspense>
        {hasCampfire && <CampfireLight />}
        <PlayerControls speed={speed} climbSpeed={climbSpeed} />
        {showStats && <Stats className="stats" />}
      </Canvas>
    </div>
  );
}

export default memo(GltfBackground);
