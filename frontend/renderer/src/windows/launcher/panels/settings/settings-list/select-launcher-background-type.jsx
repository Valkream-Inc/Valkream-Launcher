import React from "react";

import SettingsBox from "../component/settings-box/settings-box.jsx";
import {
  SelectSettings,
  SelectItemSettings,
} from "../component/select-settings/select-settings.jsx";
import { enqueueSnackbar } from "notistack";
import { useBackground } from "../../../context/background.context.jsx";

function SelectLauncherBackgroundType() {
  const { backgroundType, changeBackgroundType } = useBackground();

  const handleChange = async (event) => {
    const value = event.target.value;
    if (value === backgroundType) return;

    await changeBackgroundType(value);
    enqueueSnackbar("Vous avez changé le Fond d'écran du launcher !", {
      variant: "info",
    });
  };

  return (
    <SettingsBox
      warn={false}
      text="Vous voulez changer le Fonds d'écran du launcher ? C'est ici !"
    >
      <SelectSettings value={backgroundType} onChange={handleChange}>
        <SelectItemSettings value="video">Video</SelectItemSettings>
        <SelectItemSettings value="image">Image</SelectItemSettings>
        <SelectItemSettings value="3d">3d</SelectItemSettings>
      </SelectSettings>
    </SettingsBox>
  );
}

export default SelectLauncherBackgroundType;
