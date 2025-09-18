import React, { useEffect, useState } from "react";
import { Switch } from "@mui/material";

import SettingsBox from "../component/settings-box/settings-box.jsx";
import { enqueueSnackbar } from "notistack";

import { usePanels } from "../../../context/panels.context.jsx";

function ToggleBoostFPS() {
  const { changePanel } = usePanels();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      const boostfpsEnabled = await window.electron_API.getSettings(
        "boostfpsEnabled"
      );
      setChecked(boostfpsEnabled);
    };

    loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = async (event) => {
    const enabled = event.target.checked;
    if (enabled === checked) return;
    setChecked(enabled);
    await window.electron_API.setSettings("boostfpsEnabled", enabled);
    enqueueSnackbar(
      enabled
        ? "Options pour booster les FPS activées !"
        : "Options pour booster les FPS désactivées !",
      { variant: "info" }
    );
    changePanel("home");
  };

  return (
    <SettingsBox
      warn={false}
      text="Activer les mods pour Booster les FPS. (⚠️ Cela réduit les graphiques et
        a été concus pour les PC n'étant pas performants. Si votre PC est
        performant, vous ne devriez pas activer cette option.)"
    >
      <Switch onChange={handleChange} checked={checked} />
      <span>Activer les mods pour booster les FPS</span>
    </SettingsBox>
  );
}

export default ToggleBoostFPS;
