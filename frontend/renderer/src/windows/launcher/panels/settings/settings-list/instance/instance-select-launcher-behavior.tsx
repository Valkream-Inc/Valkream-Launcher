/**
 * @author Valkream Team
 * @license MIT-NC
 */

import type { LauncherBehaviorChangeEvent } from "../settings-list.types";
import type { LauncherBehavior } from "@shared/types";

import {
  SelectItemSettings,
  SelectSettings,
} from "../../component/select-settings/select-settings";
import SettingsBox from "../../component/settings-box/settings-box";
import { saveInstanceSetting } from "./instance-save-setting";
import type { InstanceSettingProps } from "./instance-setting.types";

function Instance_SelectLauncherBehavior(props: InstanceSettingProps) {
  const selected = (props.values.launcherBehavior ?? "close") as LauncherBehavior;

  const handleChange = (event: LauncherBehaviorChangeEvent) => {
    const value = event.target.value as LauncherBehavior;
    if (value === selected) return;
    saveInstanceSetting(
      props,
      "launcherBehavior",
      value,
      "Comportement du launcher sauvegardé !"
    );
  };

  return (
    <SettingsBox
      warn={false}
      text="Comportement du launcher au lancement du jeu :"
    >
      <SelectSettings value={selected} onChange={handleChange}>
        <SelectItemSettings value="hide">
          Masquer le launcher
        </SelectItemSettings>
        <SelectItemSettings value="close">
          Fermer le launcher
        </SelectItemSettings>
        <SelectItemSettings value="nothing">Ne rien faire</SelectItemSettings>
      </SelectSettings>
    </SettingsBox>
  );
}

export default Instance_SelectLauncherBehavior;
