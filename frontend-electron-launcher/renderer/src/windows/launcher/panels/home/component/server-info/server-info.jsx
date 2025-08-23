import React, { useEffect, useState } from "react";
import "./server-info.css";

function ServerInfo() {
  const [isLoading, setIsLoading] = useState(true);

  const [event, setEvent] = useState(null);
  const [maintenance, setMaintenance] = useState(null);
  const [serverInfos, setServerInfos] = useState(null);
  const [isInternetConnected, setIsInternetConnected] = useState(false);
  const [isServerReachable, setIsServerReachable] = useState(false);

  useEffect(() => {
    const chechInfos = async () => {
      if (
        window.electron_API &&
        window.electron_API.onUpdateInfos &&
        window.electron_API.checkInfos
      ) {
        // await window.electron_API.checkInfos();
        const handleUpdate = (infos) => {
          setEvent(infos.event || null);
          setMaintenance(infos.maintenance || null);
          setServerInfos(infos.serverInfos);
          setIsInternetConnected(infos.isInternetConnected);
          setIsServerReachable(infos.isServerReachable);
          console.log(infos);
          setIsLoading(false);
        };
        const cleanup = window.electron_API.onUpdateInfos(handleUpdate);
        return () => {
          cleanup();
        };
      }
    };

    chechInfos();
  }, []);

  // Determine the display based on the state
  const statusText = isLoading
    ? "--/--"
    : serverInfos.status === "server online"
    ? `${serverInfos.players.online}/${serverInfos.players.max}`
    : "--/--";

  const pingText = isLoading
    ? ""
    : serverInfos.status === "server online"
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
