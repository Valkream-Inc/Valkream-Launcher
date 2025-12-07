/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

import React, { useEffect, useState } from "react";

import { enqueueSnackbar } from "notistack";
import {
  SelectItemSettings,
  SelectSettings,
} from "../../component/select-settings/select-settings.jsx";
import SettingsBox from "../../component/settings-box/settings-box.jsx";

function Valheim_SelectLauncherBehavior() {
  const [selected, setSelected] = useState("close");

  useEffect(() => {
    const loadSettings = async () => {
      const launcherBehavior = await window.electron_API.getSettings(
        "launcherBehaviorWithValheim"
      );
      setSelected(launcherBehavior);
    };

    loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = async (event) => {
    const value = event.target.value;
    if (value === selected) return;
    setSelected(value);
    await window.electron_API.setSettings("launcherBehaviorWithValheim", value);
    enqueueSnackbar("Comportement du launcher sauvegardé !", {
      variant: "info",
    });
  };

  return (
    <SettingsBox
      warn={false}
      text="Comportement du launcher au lancement du jeu :"
    >
      <SelectSettings value={selected} onChange={handleChange}>
        <SelectItemSettings value="hide">
          Masquer le launcher
        </SelectItemSettings>
        <SelectItemSettings value="close">
          Fermer le launcher
        </SelectItemSettings>
        <SelectItemSettings value="nothing">Ne rien faire</SelectItemSettings>
      </SelectSettings>
    </SettingsBox>
  );
}

export default Valheim_SelectLauncherBehavior;
