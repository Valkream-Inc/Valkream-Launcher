/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

import { useFrame } from "@react-three/fiber";
import { useRef, memo } from "react";
import * as THREE from "three";

function CampfireLight() {
  const lightRef = useRef();
  const colorRef = useRef(new THREE.Color("#ff4d00")); // couleur initiale

  useFrame((state) => {
    if (lightRef.current) {
      const t = state.clock.getElapsedTime();

      // Intensité : variations plus rapides mais organiques
      const baseIntensity = 10;
      const intensityFlicker =
        baseIntensity +
        Math.sin(t * 4) * 5 +
        Math.cos(t * 7) * 2.5 +
        (Math.sin(t * 13) + Math.random() - 0.5) * 1.5;
      lightRef.current.intensity = Math.max(12, intensityFlicker);

      // Decay : variation subtile et fluide
      const baseDecay = 1.5;
      const decayFlicker =
        baseDecay +
        Math.cos(t * 3) * 0.3 +
        Math.sin(t * 8) * 0.15 +
        (Math.random() - 0.5) * 0.05;
      lightRef.current.decay = Math.max(0.7, decayFlicker);

      // Couleur : uniquement rouge-orangé, très peu de variation
      const r = 1;
      const g = 0.1 + 0.05 * Math.sin(t * 1.2); // petit orange, jamais jaune
      const b = 0;
      colorRef.current.setRGB(r, g, b);
      lightRef.current.color = colorRef.current;
    }
  });

  return (
    <pointLight
      ref={lightRef}
      position={[0, 0.5, 0]} // au-dessus du feu
      color={"#ff4d00"} // rouge/orange
      intensity={5}
      distance={100}
      decay={1.5}
      castShadow
      shadow-mapSize-width={2048}
      shadow-mapSize-height={2048}
      shadow-bias={-0.005}
      shadow-normalBias={0.05}
    />
  );
}

export default memo(CampfireLight);
