/**
 * @author Valkream Team
 * @license MIT-NC
 */

import type { ToggleChangeEvent } from "../settings-list.types";
import { Switch } from "@mui/material";
import { useEffect, useState } from "react";

import { enqueueSnackbar } from "notistack";
import { useBackground } from "../../../../context/background.context";
import SettingsBox from "../../component/settings-box/settings-box";
import { useTranslation } from "react-i18next";

function ToggleMusic() {
  const { t } = useTranslation();
  const [checked, setChecked] = useState(false);
  const { mute, unmute } = useBackground();

  useEffect(() => {
    const loadSettings = async () => {
      const musicEnabled = await window.electron_API.getSettings(
        "musicEnabled"
      );
      setChecked(musicEnabled);

      if (musicEnabled) unmute();
      else mute();
    };

    loadSettings();
  }, []);

  const handleChange = async (event: ToggleChangeEvent) => {
    const enabled = event.target.checked;
    if (enabled === checked) return;
    setChecked(enabled);
    await window.electron_API.setSettings("musicEnabled", enabled);

    if (enabled) unmute();
    else mute();

    enqueueSnackbar(enabled ? t("settings.music.on") : t("settings.music.off"), {
      variant: "info",
    });
  };

  return (
    <SettingsBox warn={false} text={t("settings.music.text")}>
      <Switch onChange={handleChange} checked={checked} />
      <span>{t("settings.music.label")}</span>
    </SettingsBox>
  );
}

export default ToggleMusic;
