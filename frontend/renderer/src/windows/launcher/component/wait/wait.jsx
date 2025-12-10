/**
 * @author Valkream Team
 * @license MIT-NC
 */

import React, { useState, useEffect } from "react";
import "./wait.css";

export default function Wait({ isVisible }) {
  const [shouldRender, setShouldRender] = useState(isVisible);

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
    }

    if (!isVisible) {
      const timeoutId = setTimeout(() => {
        setShouldRender(false);
      }, 500); // This duration should match the 'transition' property in your CSS.
      return () => clearTimeout(timeoutId);
    }
  }, [isVisible]);

  if (!shouldRender) return null;

  return (
    <div className={`wait-container ${!isVisible ? "hidden" : ""}`}>
      <div className="spinner"></div>
    </div>
  );
}
