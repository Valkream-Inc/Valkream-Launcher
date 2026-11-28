/**
 * @author Valkream Team
 * @license MIT-NC
 */

import type { ToggleChangeEvent } from "../settings-list.types";
import { Switch } from "@mui/material";
import { useEffect, useState } from "react";

import { enqueueSnackbar } from "notistack";
import { useGames } from "../../../../context/games.context";
import SettingsBox from "../../component/settings-box/settings-box";
import { useTranslation } from "react-i18next";

function ToggleAdmin() {
  const { t } = useTranslation();
  const { refreshChannel } = useGames();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      const betaEnabled = await window.electron_API.getSettings("betaEnabled");
      setChecked(betaEnabled);
    };

    loadSettings();
  }, []);

  const handleChange = async (event: ToggleChangeEvent) => {
    const enabled = event.target.checked;
    if (enabled === checked) return;
    setChecked(enabled);
    await window.electron_API.setSettings("betaEnabled", enabled);
    // Le canal de l'installation active (stable / beta) change avec ce réglage
    await refreshChannel();
    enqueueSnackbar(
      enabled ? t("beta.on") : t("beta.off"),
      { variant: "success" }
    );
  };

  return (
    <SettingsBox
      warn={true}
      text={t("beta.text")}
    >
      <Switch onChange={handleChange} checked={checked} />
      <span>{t("beta.label")}</span>
    </SettingsBox>
  );
}

export default ToggleAdmin;
