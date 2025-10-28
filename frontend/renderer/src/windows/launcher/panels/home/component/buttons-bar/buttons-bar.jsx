/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

import React from "react";
import "./css/button-bar.css";

import TipsAndUpdatesIcon from "@mui/icons-material/TipsAndUpdates";
import SettingsIcon from "@mui/icons-material/Settings";
import CompareArrowsIcon from "@mui/icons-material/CompareArrows";
import { Button } from "@mui/material";
import { useAction } from "../../../../context/action.context.jsx";
import { useGames } from "../../../../context/games.context.jsx";

import PlayButton from "./play-button.jsx";
import SevenDtoDButton from "./SevenDtoD-button.jsx";

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

function ButtonsBar({
  onSettingsClick = () => {},
  onTipsClick = () => {},
  onChangeGamesClick = () => {},
}) {
  const { actionLoading } = useAction();
  const { actualGame } = useGames();

  return (
    <>
      <TipsButton onClick={onTipsClick} />

      <div className="bottom-actions">
        {!actionLoading && (
          <Button
            variant="contained"
            className="settings-btn"
            onClick={onChangeGamesClick}
          >
            <CompareArrowsIcon fontSize="large" />
          </Button>
        )}

        {actualGame === "Valheim" && <PlayButton />}
        {actualGame === "SevenDtoD" && <SevenDtoDButton />}

        {!actionLoading && (
          <Button
            variant="contained"
            className="settings-btn"
            onClick={onSettingsClick}
          >
            <SettingsIcon fontSize="large" />
          </Button>
        )}
      </div>
    </>
  );
}

export default ButtonsBar;
