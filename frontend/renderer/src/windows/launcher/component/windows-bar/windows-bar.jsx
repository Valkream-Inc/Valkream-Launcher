/**
 * @author Valkream Team
 * @license MIT-NC
 */

import React, { useState, useEffect, memo } from "react";
import "./windows-bar.css";

const WindowsBar = () => {
  // Use state to track the window's maximization status
  const [isMaximized, setIsMaximized] = useState(false);

  // Function to handle window close
  const close = () => {
    if (window.electron_API) {
      window.electron_API.close();
    }
  };

  // Function to handle window minimization
  const minimize = () => {
    if (window.electron_API) {
      window.electron_API.minimize();
    }
  };

  // Function to handle window maximization/restoration
  const maximize = () => {
    if (window.electron_API) {
      window.electron_API.maximize();
    }
  };

  // Listen for events from the main process to update the state
  useEffect(() => {
    if (window.electron_API) {
      // Set the initial state when the component mounts
      window.electron_API.isMaximized().then((isMax) => {
        setIsMaximized(isMax);
      });

      // Listen for changes and update the state
      const onMaximized = () => setIsMaximized(true);
      const onUnmaximized = () => setIsMaximized(false);

      window.electron_API.onMaximize(onMaximized);
      window.electron_API.onUnmaximize(onUnmaximized);

      // Clean up the event listeners when the component unmounts
      return () => {
        window.electron_API.removeOnMaximize(onMaximized);
        window.electron_API.removeOnUnmaximize(onUnmaximized);
      };
    }
  }, []); // Empty dependency array means this runs once on mount

  return (
    <>
      <div className="dragbar"></div>
      <div className="windows-bar">
        <div
          id="minimize"
          className="button-windows-bar icon-minimize"
          onClick={minimize}
        ></div>
        <div
          id="maximize"
          className={`button-windows-bar ${
            isMaximized ? "icon-restore-down" : "icon-maximize"
          }`}
          onClick={maximize}
        ></div>
        <div
          id="close"
          className="button-windows-bar icon-close"
          onClick={close}
        ></div>
      </div>
    </>
  );
};

export default memo(WindowsBar);
