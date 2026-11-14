/**
 * @author Valkream Team
 * @license MIT-NC
 */

import { useProgress } from "@react-three/drei";

// ⚠️ À rendre EN DEHORS du <Canvas>, pas dans <Suspense fallback>.
// useProgress lit un store global de drei : il fonctionne hors Canvas
// et suit le chargement du .glb sans passer par <Html> de drei.
export default function LoaderFallback() {
  const { active, progress } = useProgress();

  if (!active) return null;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
        color: "#fff",
        fontSize: "1.2rem",
        textShadow: "0 0 8px rgba(0, 0, 0, 0.8)",
        zIndex: 1,
      }}
    >
      {Math.round(progress)} %
    </div>
  );
}
