/**
 * @author Valkream Team
 * @license MIT-NC
 */

import { useGLTF } from "@react-three/drei";
import React from "react";

function Model({ modelPath }) {
  const { scene } = useGLTF(modelPath);

  scene.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
      if (child.material) {
        child.material.needsUpdate = true;
      }
    }
  });

  return <primitive object={scene} position={[0, 0, 0]} />;
}

export default Model;
