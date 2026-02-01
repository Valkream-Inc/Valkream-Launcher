/**
 * @author Valkream Team
 * @license MIT-NC
 */

import React, { useState } from "react";
import "./css/server-info.css";

import { Typography } from "@mui/material";
import { useGames } from "../../../../context/games.context";

import Popup from "../../../../component/popup/popup";
import { useInfos } from "../../../../context/infos.context";
import EventCard from "../event-card/event-card";

function ServerInfo() {
  const { isLoading, serverInfos, maintenance } = useInfos();
  const { actualGame } = useGames();
  const [isMaintenancePopupOpen, setIsMaintenancePopupOpen] = useState();

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

  const handleClick = () => {
    if (!maintenance?.enabled) return;
    setIsMaintenancePopupOpen(true);
  };

  const maintenance_description = maintenance?.description || "";
  const maintenance_description_lines = maintenance_description.split("\n");

  const maintenance_message = (
    <>
      {maintenance_description_lines.map((line, idx) => (
        <React.Fragment key={idx}>
          {line}
          <br />
        </React.Fragment>
      ))}
      <br />
      <Typography component="span" sx={{ color: "yellow" }}>
        La maintenance prendra fin le{" "}
        {new Date(maintenance?.end_date || "").toLocaleString()} si tout se
        passe bien.
      </Typography>
      <br />
      <br />
      Bonne Attente !
    </>
  );

  return (
    <>
      <Popup
        open={isMaintenancePopupOpen}
        onClose={() => setIsMaintenancePopupOpen(false)}
        type="info"
        title="Maintenance"
        message={maintenance_message}
      />
      <div className="server-infos-container" onClick={handleClick}>
        <div className="header-logo">
          <img
            src={`./images/icon/Valkream-icon.png`}
            className="logo-image"
            alt="logo"
          />
          <span className="logo-text">
            {actualGame === "Valheim" ? "Valheim" : "7 Days"}
          </span>
          <span className="server-players">{statusText}</span>
        </div>
        <div>
          <span className="server-infos">
            {isLoading
              ? "🟠 Chargement ..."
              : maintenance?.enabled
              ? "🔵 En Maintenance"
              : serverInfos?.status === "server online"
              ? "🟢 En ligne"
              : "🔴 Hors ligne"}
          </span>
          <span className="server-ping"> {pingText}</span>
        </div>
      </div>
      <EventCard />
    </>
  );
}

export default ServerInfo;
