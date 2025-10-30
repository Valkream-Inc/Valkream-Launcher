/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

import React, { Suspense, useMemo, memo } from "react";
import { Canvas } from "@react-three/fiber";
import CampfireLight from "./component/campfire-light";
import LoaderFallback from "./component/loader-fallback";
import Model from "./component/model";
import PlayerControls from "./component/players-controls";
import SunsetEnvironment from "./component/sunset-environement";
import { useGames } from "../../../context/games.context.jsx";

function GltfBackground() {
  const { actualGame } = useGames();

  const { camera, lights, fogArgs, environment, hasCampfire } = useMemo(() => {
    switch (actualGame) {
      case "Valheim":
        return {
          camera: { position: [0, 1.8, 4.5], fov: 75 },
          lights: { ambientIntensity: 0.4, color: "#ffffff" },
          fogArgs: ["#202030", 0, 50],
          environment: <SunsetEnvironment />,
          hasCampfire: true,
        };
      case "SevenDtoD":
        return {
          camera: { position: [60, 60, 60], fov: 75 },
          lights: { ambientIntensity: 30, color: "#ffffff" },
          fogArgs: ["#202030", 0, 200],
          environment: null,
          hasCampfire: false,
        };
      default:
        return {
          camera: { position: [0, 2, 5], fov: 75 },
          lights: { ambientIntensity: 1, color: "#ffffff" },
          fogArgs: ["#202030", 0, 100],
          environment: null,
          hasCampfire: false,
        };
    }
  }, [actualGame]);

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
      </Canvas>
    </div>
  );
}

export default memo(GltfBackground);
