/**
 * @author Valkream Team
 * @license MIT-NC
 */

import type { ToggleChangeEvent, ToggleDevProps } from "../settings-list.types";
import { Switch } from "@mui/material";
import { useEffect, useState } from "react";

import { enqueueSnackbar } from "notistack";
import SettingsBox from "../../component/settings-box/settings-box";

function ToggleDev({
  devActive = false,
  setDevActive = () => {},
  setTab = () => {},
}: ToggleDevProps) {
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    setChecked(devActive);
  }, []);

  const handleChange = (event: ToggleChangeEvent) => {
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
