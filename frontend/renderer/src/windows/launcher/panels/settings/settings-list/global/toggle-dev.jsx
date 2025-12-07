/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

import { Switch } from "@mui/material";
import React, { useEffect, useState } from "react";

import { enqueueSnackbar } from "notistack";
import SettingsBox from "../../component/settings-box/settings-box.jsx";

function ToggleDev({
  devActive = false,
  setDevActive = () => {},
  setTab = () => {},
}) {
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    setChecked(devActive);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (event) => {
    const enabled = event.target.checked;
    if (enabled === checked) return;
    setChecked(enabled);
    setDevActive(enabled);
    if (enabled) setTab("dev");
    enqueueSnackbar(
      enabled
        ? "Outils de développement activés !"
        : "Outils de développement désactivés !",
      { variant: "success" }
    );
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
