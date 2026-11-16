/**
 * @author Valkream Team
 * @license MIT-NC
 */

import type { ToggleChangeEvent } from "../settings-list.types";
import { Switch } from "@mui/material";
import { useEffect, useState } from "react";

import { enqueueSnackbar } from "notistack";
import SettingsBox from "../../component/settings-box/settings-box";

function Valheim_ToggleLaunchSteam() {
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      const launchSteam = await window.electron_API.getSettings(
        "launchSteamWithValheim"
      );
      setChecked(launchSteam);
    };

    loadSettings();
  }, []);

  const handleChange = async (event: ToggleChangeEvent) => {
    const enabled = event.target.checked;
    if (enabled === checked) return;
    setChecked(enabled);
    await window.electron_API.setSettings("launchSteamWithValheim", enabled);
    enqueueSnackbar(
      enabled
        ? "Steam sera lancé avec le jeu."
        : "Steam ne sera pas lancé au démarrage du jeu.",
      { variant: "info" }
    );
  };

  return (
    <SettingsBox
      warn={false}
      text="Lancer Steam automatiquement au démarrage du jeu ?"
    >
      <Switch onChange={handleChange} checked={checked} />
      <span>Lancer Steam avec le jeu</span>
    </SettingsBox>
  );
}

export default Valheim_ToggleLaunchSteam;
