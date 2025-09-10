import {
  Html,
  PointerLockControls,
  Sky,
  useGLTF,
  Stars,
} from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import React, { Suspense, useEffect, useRef, useState } from "react";
import * as THREE from "three";

function DynamicEnvironment() {
  const [time, setTime] = useState(0);
  const sunLightRef = useRef();
  const moonLightRef = useRef();
  const moonMeshRef = useRef();

  // vitesse en rad/s pour 1 cycle = 120s
  const cycleSpeed = (2 * Math.PI) / 120;

  useFrame((state, delta) => {
    setTime((t) => (t + delta * cycleSpeed) % (Math.PI * 2));

    const radius = 100;
    const x = Math.sin(time) * radius;
    const y = Math.cos(time) * radius;

    if (sunLightRef.current) {
      sunLightRef.current.position.set(x, y, 0);
      sunLightRef.current.intensity = Math.max(0, y / radius); // atténuation
    }

    if (moonLightRef.current && moonMeshRef.current) {
      const mx = -x;
      const my = -y;
      moonLightRef.current.position.set(mx, my, 0);
      moonMeshRef.current.position.set(mx, my, 0);

      const moonVisible = my > 0;
      moonLightRef.current.intensity = moonVisible ? 0.3 : 0;
      moonMeshRef.current.visible = moonVisible;
    }
  });

  return (
    <>
      {/* Soleil */}
      <directionalLight
        ref={sunLightRef}
        castShadow
        intensity={1.2}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />

      {/* Lune */}
      <pointLight ref={moonLightRef} intensity={0.3} color="blue" />
      <mesh ref={moonMeshRef}>
        <sphereGeometry args={[2, 32, 32]} />
        <meshStandardMaterial emissive="white" emissiveIntensity={0.6} />
      </mesh>

      {/* Ciel dynamique */}
      <Sky sunPosition={sunLightRef.current?.position.toArray() || [0, 1, 0]} />

      {/* Étoiles */}
      <Stars radius={200} depth={50} count={5000} factor={4} fade />
    </>
  );
}

export default function GLTFViewer({
  modelPath = "/model.glb",
  speed = 4,
  climbSpeed = 2,
}) {
  return (
    <div className="video-background">
      <Canvas shadows camera={{ position: [0, 1.8, 5], fov: 75 }}>
        <ambientLight intensity={0.4} />

        <DynamicEnvironment />

        <Suspense fallback={<LoaderFallback />}>
          <Model modelPath={modelPath} />
        </Suspense>

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
        child.material.opacity = 1;
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
