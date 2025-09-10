import { Html, PointerLockControls, Sky, useGLTF } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import React, { Suspense, useEffect, useRef } from "react";
import * as THREE from "three";

export default function GLTFViewer({
  modelPath = "/model.glb",
  speed = 4,
  climbSpeed = 2,
}) {
  return (
    <div className="video-background">
      <Canvas shadows camera={{ position: [0, 1.8, 5], fov: 75 }}>
        {/* Lights */}
        <ambientLight intensity={0.6} />
        <directionalLight
          castShadow
          position={[10, 20, 10]}
          intensity={1}
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />

        {/* Sky */}
        <Sky
          distance={450000}
          sunPosition={[100, 20, 100]}
          inclination={0.49}
          azimuth={0.25}
        />

        {/* Ground */}
        <mesh rotation-x={-Math.PI / 2} receiveShadow>
          <planeGeometry args={[200, 200]} />
          <meshStandardMaterial color="#6b8e23" metalness={0} roughness={1} />
        </mesh>

        {/* The 3D model (suspended while loading) */}
        <Suspense fallback={<LoaderFallback />}>
          <Model modelPath={modelPath} />
        </Suspense>

        {/* Player controls: pointer lock + WASD movement + climb */}
        <PlayerControls speed={speed} climbSpeed={climbSpeed} />
      </Canvas>
    </div>
  );
}

function LoaderFallback() {
  return (
    <Html center>
      <div className="p-4 bg-white rounded shadow">Chargement...</div>
    </Html>
  );
}

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

function PlayerControls({ speed = 4, climbSpeed = 2 }) {
  const controlsRef = useRef();
  const { camera } = useThree();
  const moveState = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
    up: false,
    down: false,
  });

  useEffect(() => {
    const onKeyDown = (e) => {
      switch (e.code) {
        case "KeyW":
        case "ArrowUp":
          moveState.current.forward = true;
          break;
        case "KeyS":
        case "ArrowDown":
          moveState.current.backward = true;
          break;
        case "KeyA":
        case "ArrowLeft":
          moveState.current.left = true;
          break;
        case "KeyD":
        case "ArrowRight":
          moveState.current.right = true;
          break;
        case "Space": // Monter
          moveState.current.up = true;
          break;
        case "ShiftLeft": // Descendre
        case "ShiftRight":
          moveState.current.down = true;
          break;
      }
    };
    const onKeyUp = (e) => {
      switch (e.code) {
        case "KeyW":
        case "ArrowUp":
          moveState.current.forward = false;
          break;
        case "KeyS":
        case "ArrowDown":
          moveState.current.backward = false;
          break;
        case "KeyA":
        case "ArrowLeft":
          moveState.current.left = false;
          break;
        case "KeyD":
        case "ArrowRight":
          moveState.current.right = false;
          break;
        case "Space":
          moveState.current.up = false;
          break;
        case "ShiftLeft":
        case "ShiftRight":
          moveState.current.down = false;
          break;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  useFrame((state, delta) => {
    const ms = moveState.current;
    const direction = new THREE.Vector3();

    if (ms.forward) direction.z -= 1;
    if (ms.backward) direction.z += 1;
    if (ms.left) direction.x -= 1;
    if (ms.right) direction.x += 1;

    if (direction.lengthSq() > 0) {
      direction.normalize();

      const forward = new THREE.Vector3();
      camera.getWorldDirection(forward);
      forward.y = 0;
      forward.normalize();

      const right = new THREE.Vector3();
      right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

      const moveVec = new THREE.Vector3();
      moveVec.addScaledVector(forward, -direction.z);
      moveVec.addScaledVector(right, direction.x);
      moveVec.normalize();

      camera.position.addScaledVector(moveVec, speed * delta);
    }

    if (ms.up) camera.position.y += climbSpeed * delta;
    if (ms.down) camera.position.y -= climbSpeed * delta;
  });

  return <PointerLockControls ref={controlsRef} />;
}

useGLTF.preload("/model.glb");
