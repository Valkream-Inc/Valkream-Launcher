import React from "react";
import "./css/server-info.css";

import { useServerStatus } from "../../../../context/server-status.context.jsx";

function ServerInfo() {
  const { isLoading, serverInfos, maintenance } = useServerStatus();

  // Determine the display based on the state
  const statusText = isLoading
    ? "--/--"
    : serverInfos?.status === "server online"
    ? `${serverInfos.players.online}/${serverInfos.players.max}`
    : "--/--";

  const pingText = isLoading
    ? ""
    : serverInfos?.status === "server online"
    ? `(${serverInfos.ping} ms)`
    : "(...)";

  return (
    <div className="server-infos-container">
      <div className="header-logo">
        <img
          src={`${process.env.PUBLIC_URL}/images/icon/icon.png`}
          className="logo-image"
          alt="logo"
        />
        <span className="logo-text">Valkream</span>
        <span className="server-players">{statusText}</span>
      </div>
      <div>
        <span className="server-infos">
          {isLoading
            ? "🟠 Chargement ..."
            : maintenance
            ? "🔵 En Maintenance"
            : serverInfos?.status === "server online"
            ? "🟢 En ligne"
            : "🔴 Hors ligne"}
        </span>
        <span className="server-ping"> {pingText}</span>
      </div>
    </div>
  );
}

export default ServerInfo;
