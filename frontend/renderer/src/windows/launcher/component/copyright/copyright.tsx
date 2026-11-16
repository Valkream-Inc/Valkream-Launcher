/**
 * @author Valkream Team
 * @license MIT-NC
 */

import { useEffect, useState, memo } from "react";
import "./copyright.css";

import { usePanels } from "../../context/panels.context";
import type { PanelId } from "../../../../types/panels.types";
import type { CopyrightProps } from "./copyright.types";

function Copyright({ existPanels = true }: CopyrightProps) {
  const [versionLauncher, setVersionLauncher] = useState("");
  let activePanel: PanelId | undefined;

  if (!existPanels) {
    activePanel = usePanels().activePanel;
  }

  useEffect(() => {
    // Only access the Electron API after the component has mounted
    if (window.electron_API) {
      window.electron_API.versionLauncher().then(setVersionLauncher);
    }
  }, []); // The empty dependency array ensures this effect runs only once

  return (
    <div
      className="copyright"
      style={{
        display: activePanel === "settings" ? "none" : "block",
      }}
    >
      © Valkream 2026 - v{versionLauncher}
    </div>
  );
}

export default memo(Copyright);
