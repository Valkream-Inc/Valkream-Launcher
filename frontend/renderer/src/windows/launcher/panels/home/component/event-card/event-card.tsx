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

export default function EventCard() {
  const { event } = useInfos();
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
        title={event?.name || "Évènement"}
        message={event_message}
        onConfirm={
          event?.link
            ? [
                () => window.electron_API.openLink(event?.link),
                "Voir sur le site Web",
              ]
            : undefined
        }
      />
      {event?.enabled && (
        <ButtonBase
          className="event-container"
          title="Voir plus de détails"
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
