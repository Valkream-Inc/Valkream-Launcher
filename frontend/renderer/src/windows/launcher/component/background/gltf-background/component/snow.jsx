import { useFrame } from "@react-three/fiber";
import React, { useRef, useMemo } from "react";

function Snow({ count = 10000, area = 100 }) {
  const particles = useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * area; // x
      positions[i * 3 + 1] = Math.random() * area; // y
      positions[i * 3 + 2] = (Math.random() - 0.5) * area; // z
    }
    return positions;
  }, [count, area]);

  const ref = useRef();

  useFrame((state, delta) => {
    if (!ref.current) return;
    const positions = ref.current.geometry.attributes.position.array;
    for (let i = 0; i < count; i++) {
      positions[i * 3 + 1] -= delta * 5; // vitesse chute
      if (positions[i * 3 + 1] < 0) positions[i * 3 + 1] = area; // reset
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={particles}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color="white"
        size={0.125}
        sizeAttenuation
        transparent
        opacity={0.8}
      />
    </points>
  );
}

export default Snow;
