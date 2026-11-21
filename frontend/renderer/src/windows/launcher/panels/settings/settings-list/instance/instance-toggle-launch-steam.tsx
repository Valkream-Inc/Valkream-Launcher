/**
 * @author Valkream Team
 * @license MIT-NC
 */

import type { ToggleChangeEvent } from "../settings-list.types";
import { enqueueSnackbar } from "notistack";
import { Button, Switch } from "@mui/material";

import SettingsBox from "../../component/settings-box/settings-box";
import { saveInstanceSetting } from "./instance-save-setting";
import type { InstanceSettingProps } from "./instance-setting.types";
import { useTranslation } from "react-i18next";

interface Props extends InstanceSettingProps {
  /** App Steam de l'instance : sans elle, le réglage n'existe pas. */
  steamAppId?: number;
}

function Instance_ToggleLaunchSteam({ steamAppId, ...props }: Props) {
  const { t } = useTranslation();
  const checked = props.values.launchSteam === true;

  const handleChange = (event: ToggleChangeEvent) => {
    const enabled = event.target.checked;
    if (enabled === checked) return;
    saveInstanceSetting(
      props,
      "launchSteam",
      enabled,
      enabled
        ? t("instance.steam.on")
        : t("instance.steam.off")
    );
  };

  if (steamAppId === undefined) return null;

  return (
    <SettingsBox
      warn={false}
      text={t("instance.steam.text")}
    >
      <Switch onChange={handleChange} checked={checked} />
      <span>{t("instance.steam.label")}</span>
      <Button
        onClick={() =>
          window.electron_API
            .openLink(`steam://store/${steamAppId}`)
            .catch(() => enqueueSnackbar("Impossible d'ouvrir la page Steam.", { variant: "error" }))
        }
      >
        Page Steam du jeu
      </Button>
    </SettingsBox>
  );
}

export default Instance_ToggleLaunchSteam;
