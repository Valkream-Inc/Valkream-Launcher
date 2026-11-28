/**
 * @author Valkream Team
 * @license MIT-NC
 */

import { useContext, useEffect, useState, memo } from "react";
import "./copyright.css";

import { PanelsContext } from "../../context/panels.context";
import type { PanelId } from "../../../../types/panels.types";
import type { CopyrightProps } from "./copyright.types";

function Copyright({ existPanels = true }: CopyrightProps) {
  const [versionLauncher, setVersionLauncher] = useState("");
  // Hook appelé à chaque rendu (jamais conditionnel) ; ignoré si les panneaux n'existent pas.
  const panels = useContext(PanelsContext);
  const activePanel: PanelId | undefined = existPanels ? undefined : panels?.activePanel;

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
