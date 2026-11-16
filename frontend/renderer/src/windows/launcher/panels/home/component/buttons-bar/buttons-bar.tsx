/**
 * @author Valkream Team
 * @license MIT-NC
 */

import "./css/button-bar.css";

import TipsAndUpdatesIcon from "@mui/icons-material/TipsAndUpdates";
import SettingsIcon from "@mui/icons-material/Settings";
import CompareArrowsIcon from "@mui/icons-material/CompareArrows";
import { Button } from "@mui/material";
import { useAction } from "../../../../context/action.context";
import { useGames } from "../../../../context/games.context";

import ValheimButton from "./Valheim-button";
import SevenDtoDButton from "./SevenDtoD-button";
import type {
  ButtonsBarProps,
  TipsButtonProps,
} from "./buttons-bar.types";

function TipsButton({ onClick = () => {} }: TipsButtonProps) {
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
}: ButtonsBarProps) {
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

        {actualGame === "Valheim" && <ValheimButton />}
        {actualGame === "SevenDtoD" && <SevenDtoDButton />}

        <Button
          variant="contained"
          className="settings-btn"
          onClick={onSettingsClick}
        >
          <SettingsIcon fontSize="large" />
        </Button>
      </div>
    </>
  );
}

export default ButtonsBar;
