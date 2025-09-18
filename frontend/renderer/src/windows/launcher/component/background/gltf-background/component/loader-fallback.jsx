import { Html } from "@react-three/drei";
import React from "react";

function LoaderFallback() {
  return (
    <Html center>
      <div className="p-4 bg-white rounded shadow">Chargement...</div>
    </Html>
  );
}

export default LoaderFallback;
