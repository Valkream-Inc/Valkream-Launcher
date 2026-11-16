/**
 * @author Valkream Team
 * @license MIT-NC
 */

import type { ToggleChangeEvent } from "../settings-list.types";
import { Switch } from "@mui/material";
import { useEffect, useState } from "react";

import { enqueueSnackbar } from "notistack";
import SettingsBox from "../../component/settings-box/settings-box";

import { usePanels } from "../../../../context/panels.context";

function Valheim_ToggleBoostGraphicsMods() {
  const { changePanel } = usePanels();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      const boostfpsEnabled = await window.electron_API.getSettings(
        "boostgraphicModsEnabledWithValheim"
      );
      setChecked(boostfpsEnabled);
    };

    loadSettings();
  }, []);

  const handleChange = async (event: ToggleChangeEvent) => {
    const enabled = event.target.checked;
    if (enabled === checked) return;
    setChecked(enabled);
    await window.electron_API.setSettings(
      "boostgraphicModsEnabledWithValheim",
      enabled
    );
    enqueueSnackbar(
      enabled
        ? "Options pour booster les Graphiques activées !"
        : "Options pour booster les Graphiques désactivées !",
      { variant: "info" }
    );
    changePanel("home");
  };

  return (
    <SettingsBox
      warn={false}
      text="Activer les mods pour Booster les Graphiques. (⚠️ Cela réduit les FPS et
        a été concus pour les PC performants. Si votre PC n'est pas
        performant, vous ne devriez pas activer cette option.)"
    >
      <Switch onChange={handleChange} checked={checked} />
      <span>Activer les mods pour booster les Graphiques</span>
    </SettingsBox>
  );
}

export default Valheim_ToggleBoostGraphicsMods;
