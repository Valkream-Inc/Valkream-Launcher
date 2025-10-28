/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

import React from "react";
import { Html } from "@react-three/drei";

function LoaderFallback() {
  return (
    <Html center>
      <h1 style={{ color: "white" }}>Chargement...</h1>
    </Html>
  );
}

export default LoaderFallback;
