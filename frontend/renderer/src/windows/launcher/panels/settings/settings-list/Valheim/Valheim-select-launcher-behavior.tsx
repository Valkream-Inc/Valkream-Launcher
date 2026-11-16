/**
 * @author Valkream Team
 * @license MIT-NC
 */

import type { LauncherBehaviorChangeEvent } from "../settings-list.types";
import type { LauncherBehavior } from "@shared/types";
import { useEffect, useState } from "react";

import { enqueueSnackbar } from "notistack";
import {
  SelectItemSettings,
  SelectSettings,
} from "../../component/select-settings/select-settings";
import SettingsBox from "../../component/settings-box/settings-box";

function Valheim_SelectLauncherBehavior() {
  const [selected, setSelected] = useState<LauncherBehavior>("close");

  useEffect(() => {
    const loadSettings = async () => {
      const launcherBehavior = await window.electron_API.getSettings(
        "launcherBehaviorWithValheim"
      );
      setSelected(launcherBehavior);
    };

    loadSettings();
  }, []);

  const handleChange = async (event: LauncherBehaviorChangeEvent) => {
    const value = event.target.value as LauncherBehavior;
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
