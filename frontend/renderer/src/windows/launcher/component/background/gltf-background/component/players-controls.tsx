/**
 * @author Valkream Team
 * @license MIT-NC
 */

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

import { OrbitControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";

function PlayerControls({ speed = 4, climbSpeed = 2 }) {
  const controlsRef = useRef();
  const { camera, gl } = useThree();

  const moveState = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
    up: false,
    down: false,
  });

  const rotateState = useRef(false);

  // Déplacement clavier
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
        case "Space":
          moveState.current.up = true;
          break;
        case "ShiftLeft":
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

  // Activer rotation seulement avec clic gauche
  useEffect(() => {
    const onMouseDown = (e) => {
      if (e.button === 0) rotateState.current = true;
    };
    const onMouseUp = (e) => {
      if (e.button === 0) rotateState.current = false;
    };
    gl.domElement.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      gl.domElement.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [gl.domElement]);

  // Déplacement
  useFrame((_, delta) => {
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

  return (
    <OrbitControls
      autoRotate
      ref={controlsRef}
      enablePan={false}
      enableZoom={true}
      enableRotate={true}
      minDistance={0.5} // distance minimale à la cible
      maxDistance={1500} // distance maximale à la cible
      rotateSpeed={0.5}
    />
  );
}

export default PlayerControls;
