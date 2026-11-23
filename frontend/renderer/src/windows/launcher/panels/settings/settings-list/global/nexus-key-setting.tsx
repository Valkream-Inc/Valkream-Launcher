/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Clé API personnelle Nexus Mods : stockée dans les réglages locaux, jamais envoyée au remote.
 */

import { Button, TextField } from "@mui/material";
import { enqueueSnackbar } from "notistack";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import SettingsBox from "../../component/settings-box/settings-box";

function NexusKeySetting() {
  const { t } = useTranslation();
  const [saved, setSaved] = useState("");
  const [value, setValue] = useState("");

  useEffect(() => {
    void window.electron_API.getSettings("nexusApiKey").then((key) => {
      setSaved(key ?? "");
      setValue(key ?? "");
    });
  }, []);

  const save = async () => {
    const key = value.trim();
    await window.electron_API.setSettings("nexusApiKey", key);
    setSaved(key);
    setValue(key);
    enqueueSnackbar(key ? t("settings.nexusKey.saved") : t("settings.nexusKey.cleared"), { variant: "success" });
  };

  return (
    <SettingsBox warn={false} text={t("settings.nexusKey.text")}>
      <TextField
        size="small"
        type="password"
        autoComplete="off"
        label={t("settings.nexusKey.label")}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => event.key === "Enter" && void save()}
      />
      <Button disabled={value.trim() === saved} onClick={() => void save()}>
        {t("settings.nexusKey.save")}
      </Button>
    </SettingsBox>
  );
}

export default NexusKeySetting;
