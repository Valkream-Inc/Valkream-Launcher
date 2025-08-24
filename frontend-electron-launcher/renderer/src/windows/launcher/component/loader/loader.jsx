import React, { useState, useEffect } from "react";
import "./loader.css";

export default function Loader({ isVisible }) {
  const [shouldRender, setShouldRender] = useState(isVisible);

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
    }

    if (!isVisible) {
      const timeoutId = setTimeout(() => {
        setShouldRender(false);
      }, 2000); // This duration should match the 'transition' property in your CSS.
      return () => clearTimeout(timeoutId);
    }
  }, [isVisible]);

  if (!shouldRender) return null;

  return (
    <div className={`loader-container ${!isVisible ? "hidden" : ""}`}>
      <img
        src={process.env.PUBLIC_URL + "/images/icon/icon.png"}
        alt="logo"
        className="img-loader"
      />
      <br />
      <div className="spinner"></div>
    </div>
  );
}
