/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

import { Switch } from "@mui/material";
import React, { useEffect, useState } from "react";

import { enqueueSnackbar } from "notistack";
import SettingsBox from "../../component/settings-box/settings-box.jsx";

import { usePanels } from "../../../../context/panels.context.jsx";

function Valheim_ToggleAdminMods() {
  const { changePanel } = usePanels();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      const adminEnabled = await window.electron_API.getSettings(
        "adminModsEnabledWithValheim"
      );
      setChecked(adminEnabled);
    };

    loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = async (event) => {
    const enabled = event.target.checked;
    if (enabled === checked) return;
    setChecked(enabled);
    await window.electron_API.setSettings(
      "adminModsEnabledWithValheim",
      enabled
    );
    enqueueSnackbar(
      enabled ? "Options admin activées !" : "Options admin désactivées !",
      { variant: "success" }
    );
    changePanel("home");
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

export default Valheim_ToggleAdminMods;
