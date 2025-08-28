import React, { useEffect, useState } from "react";
import { Switch } from "@mui/material";

import { SettingsBox } from "../component/settings-box/settings-box.jsx";
import { useVideoBackground } from "../../../context/video-background.context.jsx";

function ToggleMusic() {
  const [checked, setChecked] = useState(false);
  const { mute, unmute } = useVideoBackground();

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
    setChecked(enabled);
    await window.electron_API.setSettings("musicEnabled", enabled);

    if (enabled) unmute();
    else mute();
  };

  return (
    <SettingsBox warn={false} text="La musique vous gêne ? Désactivez-la ici.">
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <Switch onChange={handleChange} checked={checked} />
        <span>Activer la musique de la vidéo</span>
      </div>
    </SettingsBox>
  );
}

export default ToggleMusic;
