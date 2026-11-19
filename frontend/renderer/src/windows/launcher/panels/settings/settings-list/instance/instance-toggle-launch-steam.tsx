/**
 * @author Valkream Team
 * @license MIT-NC
 */

import type { ToggleChangeEvent } from "../settings-list.types";
import { Switch } from "@mui/material";

import SettingsBox from "../../component/settings-box/settings-box";
import { saveInstanceSetting } from "./instance-save-setting";
import type { InstanceSettingProps } from "./instance-setting.types";

function Instance_ToggleLaunchSteam(props: InstanceSettingProps) {
  const checked = props.values.launchSteam === true;

  const handleChange = (event: ToggleChangeEvent) => {
    const enabled = event.target.checked;
    if (enabled === checked) return;
    saveInstanceSetting(
      props,
      "launchSteam",
      enabled,
      enabled
        ? "Steam sera lancé avec le jeu."
        : "Steam ne sera pas lancé au démarrage du jeu."
    );
  };

  return (
    <SettingsBox
      warn={false}
      text="Lancer Steam automatiquement au démarrage du jeu ?"
    >
      <Switch onChange={handleChange} checked={checked} />
      <span>Lancer Steam avec le jeu</span>
    </SettingsBox>
  );
}

export default Instance_ToggleLaunchSteam;
