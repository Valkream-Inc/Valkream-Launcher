/**
 * @author Valkream Team
 * @license MIT-NC
 */

import React, { useEffect, useState, memo } from "react";
import "./copyright.css";

import { usePanels } from "../../context/panels.context";

function Copyright({ existPanels = true }) {
  const [versionLauncher, setVersionLauncher] = useState("");
  let activePanel;

  if (!existPanels) {
    activePanel = usePanels();
  }

  useEffect(() => {
    // Only access the Electron API after the component has mounted
    if (window.electron_API) {
      setVersionLauncher(window.electron_API.versionLauncher());
    }
  }, []); // The empty dependency array ensures this effect runs only once

  return (
    <div
      className="copyright"
      style={{
        display: activePanel === "settings" ? "none" : "block",
      }}
    >
      © Valkream 2025 - v{versionLauncher}
    </div>
  );
}

export default memo(Copyright);
