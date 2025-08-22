import React, { useState, useEffect } from "react";
import "./launcher.css";

function Launcher() {
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
      <video id="background-video" autoPlay loop playsInline>
        <source src="/videos/background.mp4" type="video/mp4" />
      </video>

      <div className="dragbar"></div>
      <div className="frame">
        <div
          id="minimize"
          className="button-frame icon-minimize"
          onClick={minimize}
        ></div>
        <div
          id="maximize"
          className={`button-frame ${
            isMaximized ? "icon-restore-down" : "icon-maximize"
          }`}
          onClick={maximize}
        ></div>
        <div
          id="close"
          className="button-frame icon-close"
          onClick={close}
        ></div>
      </div>

      <div className="popup">
        <div className="popup-tab">
          <div className="popup-title"></div>
          <div className="popup-content"></div>
          <div className="popup-options">
            <button className="popup-button">OK</button>
          </div>
        </div>
      </div>
      <div className="panels"></div>
      <div id="snackbar-container"></div>
    </>
  );
}

export default Launcher;
