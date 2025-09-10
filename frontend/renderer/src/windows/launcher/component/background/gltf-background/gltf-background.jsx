import { Canvas } from "@react-three/fiber";
import React, { Suspense } from "react";

import PlayerControls from "./component/players-controls";
import SunsetEnvironment from "./component/sunset-environement";
import Model from "./component/model";
import LoaderFallback from "./component/loader-fallback";

function GltfBackground() {
  const speed = 4;
  const climbSpeed = 2;

  return (
    <div className="background">
      <Canvas shadows camera={{ position: [0, 1.8, 4.5], fov: 75 }}>
        <ambientLight intensity={0.4} />
        <fog attach="fog" args={["#202030", 0, 50]} />

        <SunsetEnvironment />

        <Suspense fallback={<LoaderFallback />}>
          <Model modelPath={"/models/valheim_black_forest.glb"} />
        </Suspense>

        <PlayerControls speed={speed} climbSpeed={climbSpeed} />
      </Canvas>
    </div>
  );
}

export default GltfBackground;
