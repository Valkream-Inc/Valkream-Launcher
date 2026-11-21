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

interface Props extends InstanceSettingProps {
  /** App Steam de l'instance : sans elle, le réglage n'existe pas. */
  steamAppId?: number;
}

function Instance_ToggleLaunchSteam({ steamAppId, ...props }: Props) {
  const checked = props.values.launchSteam === true;

  const handleChange = (event: ToggleChangeEvent) => {
    const enabled = event.target.checked;
    if (enabled === checked) return;
    saveInstanceSetting(
      props,
      "launchSteam",
      enabled,
      enabled
        ? "Steam sera démarré avant le jeu."
        : "Steam ne sera plus démarré par le launcher."
    );
  };

  if (steamAppId === undefined) return null;

  return (
    <SettingsBox
      warn={false}
      text="Démarrer Steam avant le jeu (nécessaire à la vérification de possession du jeu) ?"
    >
      <Switch onChange={handleChange} checked={checked} />
      <span>Lancer Steam avec le jeu</span>
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
