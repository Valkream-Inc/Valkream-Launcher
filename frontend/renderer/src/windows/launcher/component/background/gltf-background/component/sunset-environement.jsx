import { Sky, Stars } from "@react-three/drei";
import React, { useMemo } from "react";
import * as THREE from "three";

import Snow from "./snow";

function SunsetEnvironment() {
  // Position du soleil basse pour un coucher de soleil
  const sunPosition = useMemo(() => new THREE.Vector3(-50, 0, 100), []);

  return (
    <>
      <directionalLight
        castShadow
        intensity={0.5}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />

      <Sky
        sunPosition={sunPosition}
        inclination={0.01} // proche de l'horizon
        azimuth={0.25} // orientation
        turbidity={100} // ciel très chaud/orangé
        rayleigh={0.5} // scattering atmosphérique plus faible pour rouge
        mieCoefficient={0.01} // particules atmosphériques
        mieDirectionalG={0.8}
      />

      {/* Étoiles */}
      <Stars radius={200} depth={50} count={5000} factor={4} fade />

      {/* Chute */}
      <Snow />
    </>
  );
}

export default SunsetEnvironment;
