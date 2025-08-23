import React from "react";
import "./button-bar.css";

import TipsAndUpdatesIcon from "@mui/icons-material/TipsAndUpdates";
import SettingsIcon from "@mui/icons-material/Settings";
import SportsEsportsIcon from "@mui/icons-material/SportsEsports";
import { Button, ButtonBase, Stack } from "@mui/material";

function TipsButton({ onClick = () => {} }) {
  return (
    <button className="button-tips" onClick={onClick}>
      <TipsAndUpdatesIcon
        fontSize="large"
        sx={{ fill: "yellow" }}
        className="button-tips-icon"
      />
    </button>
  );
}

function PlayButton({
  text = "Loading...",
  icon = false,
  onClick = () => {},
  disabled = false,
}) {
  return (
    <ButtonBase
      onClick={onClick}
      className="play-btn"
      disabled={disabled}
      disableRipple={disabled}
    >
      <Stack direction={"row"} spacing={1} sx={{ alignItems: "center" }}>
        {icon && <SportsEsportsIcon fontSize="large" className="icon-play" />}
        {text.split("\n").map((line, index) => (
          <React.Fragment key={index}>
            {line}
            {index < text.split("\n").length - 1 && <br />}
          </React.Fragment>
        ))}
      </Stack>
    </ButtonBase>
  );
}

function ButtonsBar({
  playButtonText = "Loading...",
  playIcon = false,
  isDisabled = false,
  onPlayClick = () => {},
  onSettingsClick = () => {},
  onTipsClick = () => {},
}) {
  return (
    <>
      <TipsButton onClick={onTipsClick} />

      <div className="bottom-actions">
        <PlayButton
          text={playButtonText}
          icon={playIcon}
          onClick={onPlayClick}
          disabled={isDisabled}
        />

        {!isDisabled && (
          <Button
            variant="contained"
            className="settings-btn"
            onClick={onSettingsClick}
            disabled={isDisabled}
          >
            <SettingsIcon fontSize="large" />
          </Button>
        )}
      </div>
    </>
  );
}

export default ButtonsBar;
