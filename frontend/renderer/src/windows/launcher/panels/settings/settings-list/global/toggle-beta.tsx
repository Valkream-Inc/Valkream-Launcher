/**
 * @author Valkream Team
 * @license MIT-NC
 */

import type { ToggleChangeEvent } from "../settings-list.types";
import { Switch } from "@mui/material";
import { useEffect, useState } from "react";

import { enqueueSnackbar } from "notistack";
import SettingsBox from "../../component/settings-box/settings-box";

function ToggleAdmin() {
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      const betaEnabled = await window.electron_API.getSettings("betaEnabled");
      setChecked(betaEnabled);
    };

    loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = async (event: ToggleChangeEvent) => {
    const enabled = event.target.checked;
    if (enabled === checked) return;
    setChecked(enabled);
    await window.electron_API.setSettings("betaEnabled", enabled);
    enqueueSnackbar(
      enabled ? "Tests beta activées !" : "Tests beta désactivées !",
      { variant: "success" }
    );
  };

  return (
    <SettingsBox
      warn={true}
      text="Activer les tests beta (cella vas recuperer les mises à jour beta et vas
        desactiver la mise à jour du launcher)"
    >
      <Switch onChange={handleChange} checked={checked} />
      <span>Activer les tests Betas</span>
    </SettingsBox>
  );
}

export default ToggleAdmin;
