import { Canvas } from "@react-three/fiber";
import React, { Suspense } from "react";

import CampfireLight from "./component/campfire-light";
import LoaderFallback from "./component/loader-fallback";
import Model from "./component/model";
import PlayerControls from "./component/players-controls";
import SunsetEnvironment from "./component/sunset-environement";

import { useGames } from "../../../context/games.context.jsx";

function GltfBackground() {
  const { actualGame } = useGames();

  const speed = 4;
  const climbSpeed = 2;

  return (
    <div className="background">
      {/* Valheim */}
      {actualGame === "Valheim" && (
        <Canvas
          shadows
          camera={{
            position: [0, 1.8, 4.5],
            fov: 75,
          }}
        >
          <ambientLight intensity={0.4} color={"#ffffff"} />
          <fog attach="fog" args={["#202030", 0, 50]} />

          <SunsetEnvironment />

          <Suspense fallback={<LoaderFallback />}>
            <Model modelPath={`./models/${actualGame}-3d.glb`} />
          </Suspense>

          <CampfireLight />

          <PlayerControls speed={speed} climbSpeed={climbSpeed} />
        </Canvas>
      )}

      {/* SevenDtoD */}
      {actualGame === "SevenDtoD" && (
        <Canvas
          shadows
          camera={{
            position: [60, 60, 60],
            fov: 75,
          }}
        >
          <ambientLight intensity={30} color={"#ffffff"} />
          <fog attach="fog" args={["#202030", 0, 200]} />

          <Suspense fallback={<LoaderFallback />}>
            <Model modelPath={`./models/${actualGame}-3d.glb`} />
          </Suspense>

          <PlayerControls speed={speed} climbSpeed={climbSpeed} />
        </Canvas>
      )}
    </div>
  );
}

export default GltfBackground;
