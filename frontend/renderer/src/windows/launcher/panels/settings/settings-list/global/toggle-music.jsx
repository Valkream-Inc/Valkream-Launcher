/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

import { Switch } from "@mui/material";
import React, { useEffect, useState } from "react";

import { enqueueSnackbar } from "notistack";
import { useBackground } from "../../../../context/background.context.jsx";
import SettingsBox from "../../component/settings-box/settings-box.jsx";

function ToggleMusic() {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = async (event) => {
    const enabled = event.target.checked;
    if (enabled === checked) return;
    setChecked(enabled);
    await window.electron_API.setSettings("musicEnabled", enabled);

    if (enabled) unmute();
    else mute();

    enqueueSnackbar(enabled ? "Musique activée !" : "Musique désactivée !", {
      variant: "info",
    });
  };

  return (
    <SettingsBox warn={false} text="La musique vous gêne ? Désactivez-la ici.">
      <Switch onChange={handleChange} checked={checked} />
      <span>Activer la musique de la vidéo</span>
    </SettingsBox>
  );
}

export default ToggleMusic;
