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
import { useTranslation } from "react-i18next";

function Instance_SelectLauncherBehavior(props: InstanceSettingProps) {
  const { t } = useTranslation();
  const selected = (props.values.launcherBehavior ?? "close") as LauncherBehavior;

  const handleChange = (event: LauncherBehaviorChangeEvent) => {
    const value = event.target.value as LauncherBehavior;
    if (value === selected) return;
    saveInstanceSetting(
      props,
      "launcherBehavior",
      value,
      t("instance.behavior.saved")
    );
  };

  return (
    <SettingsBox
      warn={false}
      text={t("instance.behavior.text")}
    >
      <SelectSettings value={selected} onChange={handleChange}>
        <SelectItemSettings value="hide">
          {t("instance.behavior.hide")}
        </SelectItemSettings>
        <SelectItemSettings value="close">
          {t("instance.behavior.close")}
        </SelectItemSettings>
        <SelectItemSettings value="nothing">{t("instance.behavior.nothing")}</SelectItemSettings>
      </SelectSettings>
    </SettingsBox>
  );
}

export default Instance_SelectLauncherBehavior;
