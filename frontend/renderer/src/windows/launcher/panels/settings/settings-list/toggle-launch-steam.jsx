import React, { useEffect, useState } from "react";
import { Switch } from "@mui/material";

import { SettingsBox } from "../component/settings-box/settings-box.jsx";

function ToggleLaunchSteam() {
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      const launchSteam = await window.electron_API.getSettings("launchSteam");
      setChecked(launchSteam);
    };

    loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = async (event) => {
    const enabled = event.target.checked;
    setChecked(enabled);
    await window.electron_API.setSettings("launchSteam", enabled);
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

export default ToggleLaunchSteam;
