import React, { useEffect, useState } from "react";
import { Switch } from "@mui/material";

import { SettingsBox } from "../component/settings-box/settings-box.jsx";

function ToggleDev({ devActive = false, setDevActive = () => {} }) {
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    setChecked(devActive);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (event) => {
    const enabled = event.target.checked;
    setChecked(enabled);
    setDevActive(enabled);
  };

  return (
    <SettingsBox
      warn={true}
      text="Besoin d'activer les outils de développement ? Faites-le ici."
    >
      <Switch onChange={handleChange} checked={checked} />
      <span>Activer les outils de développement</span>
    </SettingsBox>
  );
}

export default ToggleDev;
