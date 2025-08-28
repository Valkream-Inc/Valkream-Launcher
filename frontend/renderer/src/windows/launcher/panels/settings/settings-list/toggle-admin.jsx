import React, { useEffect, useState } from "react";
import { Switch } from "@mui/material";

import { SettingsBox } from "../component/settings-box/settings-box.jsx";

function ToggleAdmin() {
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      const adminEnabled = await window.electron_API.getSettings(
        "adminEnabled"
      );
      setChecked(adminEnabled);
    };

    loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = async (event) => {
    const enabled = event.target.checked;
    setChecked(enabled);
    await window.electron_API.setSettings("adminEnabled", enabled);
  };

  return (
    <SettingsBox
      warn={true}
      text="Activer les mods administrateur (⚠️ vous ne pourrez pas rejoindre le
        serveur si vous n'êtes pas admin : Vous ne devez activer cette option
        que si vous êtes admin ou si vous jouez dans une partie privée)"
    >
      <Switch onChange={handleChange} checked={checked} />
      <span>Activer les mods admin</span>
    </SettingsBox>
  );
}

export default ToggleAdmin;
