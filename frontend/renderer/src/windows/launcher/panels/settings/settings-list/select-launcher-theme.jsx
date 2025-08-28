import React, { useEffect, useState } from "react";

import { SettingsBox } from "../component/settings-box/settings-box.jsx";
import { useTheme } from "../../../context/theme.context.jsx";
import {
  SelectSettings,
  SelectItemSettings,
} from "../component/select-settings/select-settings.jsx";

function SelectLauncherTheme() {
  const [selected, setSelected] = useState("modern");
  const { theme, changeTheme } = useTheme();

  useEffect(() => {
    const loadSettings = async () => {
      const launcherTheme = await window.electron_API.getSettings(
        "launcherTheme"
      );
      setSelected(launcherTheme);
      if (launcherTheme !== theme && launcherTheme) changeTheme(launcherTheme);
    };

    loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = async (event) => {
    const value = event.target.value;
    setSelected(value);
    await window.electron_API.setSettings("launcherTheme", value);
    if (value !== theme) changeTheme(value);
  };

  return (
    <SettingsBox
      warn={false}
      text="Vous voulez changer le theme du launcher ? Faites-le ici."
    >
      <SelectSettings value={selected} onChange={handleChange}>
        <SelectItemSettings value="old">Old</SelectItemSettings>
        <SelectItemSettings value="modern">Modern</SelectItemSettings>
        <SelectItemSettings value="futuristic">Futuristic</SelectItemSettings>
      </SelectSettings>
    </SettingsBox>
  );
}

export default SelectLauncherTheme;
