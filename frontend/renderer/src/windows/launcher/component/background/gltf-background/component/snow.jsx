/**
 * @author Valkream Team
 * @license MIT-NC
 */

import { useFrame } from "@react-three/fiber";
import React, { useMemo, useRef } from "react";

function Snow({ count = 15000, area = 50 }) {
  // positions et vitesses
  const { positions, velocities } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 0] = (Math.random() - 0.5) * area; // x
      pos[i * 3 + 1] = Math.random() * area; // y
      pos[i * 3 + 2] = (Math.random() - 0.5) * area; // z
      vel[i] = 1 + Math.random() * 2; // vitesse verticale différente
    }
    return { positions: pos, velocities: vel };
  }, [count, area]);

  const ref = useRef();

  useFrame((state, delta) => {
    if (!ref.current) return;
    const pos = ref.current.geometry.attributes.position.array;

    for (let i = 0; i < count; i++) {
      // chute verticale avec vitesse individuelle
      pos[i * 3 + 1] -= velocities[i] * delta;

      // petit mouvement horizontal "vent"
      pos[i * 3 + 0] += Math.sin(state.clock.elapsedTime + i) * 0.002;
      pos[i * 3 + 2] += Math.cos(state.clock.elapsedTime + i) * 0.002;

      // si flocon en dessous de 0 → respawn en haut
      if (pos[i * 3 + 1] < 0) {
        pos[i * 3 + 0] = (Math.random() - 0.5) * area;
        pos[i * 3 + 1] = area;
        pos[i * 3 + 2] = (Math.random() - 0.5) * area;
      }
    }

    ref.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color="white"
        size={0.1}
        sizeAttenuation
        transparent
        opacity={0.9}
      />
    </points>
  );
}

export default Snow;
