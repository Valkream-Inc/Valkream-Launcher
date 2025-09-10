import React from "react";

import SettingsBox from "../component/settings-box/settings-box.jsx";
import { useTheme } from "../../../context/theme.context.jsx";
import {
  SelectSettings,
  SelectItemSettings,
} from "../component/select-settings/select-settings.jsx";
import { enqueueSnackbar } from "notistack";

function SelectLauncherTheme() {
  const { theme, changeTheme } = useTheme();

  const handleChange = async (event) => {
    const value = event.target.value;
    if (value === theme) return;

    await changeTheme(value);
    enqueueSnackbar("Vous avez changé le theme du launcher !", {
      variant: "info",
    });
  };

  return (
    <SettingsBox
      warn={false}
      text="Vous voulez changer le theme du launcher ? Faites-le ici."
    >
      <SelectSettings value={theme} onChange={handleChange}>
        <SelectItemSettings value="old">Old</SelectItemSettings>
        <SelectItemSettings value="modern">Modern</SelectItemSettings>
        <SelectItemSettings value="futuristic">Futuristic</SelectItemSettings>
      </SelectSettings>
    </SettingsBox>
  );
}

export default SelectLauncherTheme;
