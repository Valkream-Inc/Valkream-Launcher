/**
 * @author Valkream Team
 * @license MIT-NC
 */

import type { ToggleChangeEvent, ToggleDevProps } from "../settings-list.types";
import { Switch } from "@mui/material";
import { useEffect, useState } from "react";

import { enqueueSnackbar } from "notistack";
import SettingsBox from "../../component/settings-box/settings-box";
import { useTranslation } from "react-i18next";

function ToggleDev({
  devActive = false,
  setDevActive = () => {},
  setTab = () => {},
}: ToggleDevProps) {
  const { t } = useTranslation();
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
        ? t("settings.dev.on")
        : t("settings.dev.off"),
      { variant: "success" }
    );
  };

  return (
    <SettingsBox
      warn={true}
      text={t("settings.dev.text")}
    >
      <Switch onChange={handleChange} checked={checked} />
      <span>{t("settings.dev.label")}</span>
    </SettingsBox>
  );
}

export default ToggleDev;
