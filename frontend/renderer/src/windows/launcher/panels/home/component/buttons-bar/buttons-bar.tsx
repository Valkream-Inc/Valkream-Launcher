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

import InstanceButton from "./instance-button";
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

        <InstanceButton />

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
