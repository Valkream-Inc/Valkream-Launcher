/**
 * @author Valkream Team
 * @license MIT-NC
 */

import React, { useState } from "react";
import "./event-card.css";

import { ButtonBase } from "@mui/material";
import Popup from "../../../../component/popup/popup";
import { useInfos } from "../../../../context/infos.context";
import ImagePreview from "../image-preview/image-preview";
import { useTranslation } from "react-i18next";

export default function EventCard() {
  const { t } = useTranslation();
  const { event: rawEvent } = useInfos();
  // Le contexte peut renvoyer `false` quand il n'y a pas d'évènement
  const event = rawEvent || null;
  const eventLink = event?.link;
  const [isEventPopupOpen, setIsEventPopupOpen] = useState(false);

  const handleClick = () => setIsEventPopupOpen(true);

  const event_description = event?.description || "";
  const event_description_lines = event_description.split("\n");

  const event_message = (
    <>
      {event_description_lines.map((line, idx) => (
        <React.Fragment key={idx}>
          {line}
          <br />
        </React.Fragment>
      ))}
    </>
  );

  return (
    <>
      <Popup
        open={isEventPopupOpen}
        onClose={() => setIsEventPopupOpen(false)}
        type="event"
        title={event?.name || t("home.event")}
        message={event_message}
        onConfirm={
          eventLink
            ? [
                () => window.electron_API.openLink(eventLink),
                "Voir sur le site Web",
              ]
            : undefined
        }
      />
      {event?.enabled && (
        <ButtonBase
          className="event-container"
          title={t("home.moreDetails")}
          onClick={handleClick}
        >
          {event?.image && (
            <ImagePreview
              src={event?.image}
              alt={event?.name}
              className="event-image"
            />
          )}
          <div className="event-content">
            <h1 className="event-title">{event?.name}</h1>
            {event?.date && (
              <div style={{ display: "flex", alignItems: "center" }}>
                <div className="event-date">
                  {new Date(event?.date || "").toLocaleString()}
                </div>
              </div>
            )}
          </div>
        </ButtonBase>
      )}
    </>
  );
}
