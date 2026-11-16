/**
 * @author Valkream Team
 * @license MIT-NC
 */

import { useGLTF } from "@react-three/drei";
import type { Material, Mesh } from "three";

import type { ModelProps } from "./model.types";

function Model({ modelPath }: ModelProps) {
  const { scene } = useGLTF(modelPath);

  scene.traverse((child) => {
    const mesh = child as Mesh;
    if (mesh.isMesh) {
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      if (mesh.material) {
        (mesh.material as Material).needsUpdate = true;
      }
    }
  });

  return <primitive object={scene} position={[0, 0, 0]} />;
}

export default Model;
