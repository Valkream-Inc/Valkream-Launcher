import React, { useEffect, useState } from "react";
import "./css/loader.css";

import { useGames } from "../../context/games.context";

export default function Loader({ isVisible }) {
  const { actualGame } = useGames();
  const [shouldRender, setShouldRender] = useState(isVisible);

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
    }

    if (!isVisible) {
      const timeoutId = setTimeout(() => {
        setShouldRender(false);
      }, 1500); // This duration should match the 'transition' property in your CSS.
      return () => clearTimeout(timeoutId);
    }
  }, [isVisible]);

  if (!shouldRender) return null;

  return (
    <div className={`loader-container ${!isVisible ? "hidden" : ""}`}>
      <img
        src={`./images/${actualGame}-icon-loader.png`}
        alt="logo"
        className="img-loader"
      />
      <br />
      <div className="spinner"></div>
    </div>
  );
}
