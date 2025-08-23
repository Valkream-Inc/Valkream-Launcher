import React, { useEffect, useState } from "react";
import "./copyright.css";

function Copyright() {
  const [versionLauncher, setVersionLauncher] = useState("");

  useEffect(() => {
    // Only access the Electron API after the component has mounted
    if (window.electron_API) {
      setVersionLauncher(window.electron_API.versionLauncher());
    }
  }, []); // The empty dependency array ensures this effect runs only once

  return <div className="copyright">© Valkream 2025 - v{versionLauncher}</div>;
}

export default Copyright;
