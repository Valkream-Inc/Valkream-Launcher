/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Réglages propres à un jeu, décrits par `customGamesSettings` (config render) et
 * stockés par installation (stable et beta ont chacun les leurs).
 */

import type { ToggleChangeEvent } from "../settings-list.types";
import { MenuItem, Select, Switch } from "@mui/material";

import type {
  CustomGameSetting,
  SettingLevel,
} from "../../../../../../instances/instances.types";
import SettingsBox from "../../component/settings-box/settings-box";
import { saveInstanceSetting } from "./instance-save-setting";
import type { InstanceSettingProps } from "./instance-setting.types";

interface Props extends InstanceSettingProps {
  settings: CustomGameSetting[];
  /** Seuls les réglages de ce niveau sont rendus. */
  level: SettingLevel;
}

function Instance_CustomSettings({ settings, level, ...props }: Props) {
  const { values } = props;

  return (
    <>
      {settings
        .filter((setting) => (setting.level ?? "normal") === level)
        .map((setting) => (
          <SettingsBox
            key={setting.settingsName}
            warn={level === "danger"}
            text={setting.text}
          >
            {setting.type === "toggle" ? (
              <>
                <Switch
                  checked={
                    (values[setting.settingsName] ?? setting.default ?? false) ===
                    true
                  }
                  onChange={(event: ToggleChangeEvent) =>
                    saveInstanceSetting(
                      props,
                      setting.settingsName,
                      event.target.checked
                    )
                  }
                />
                <span>{setting.label}</span>
              </>
            ) : (
              <>
                <span>{setting.label}</span>
                <Select
                  size="small"
                  value={String(
                    values[setting.settingsName] ??
                      setting.default ??
                      setting.options[0]?.value ??
                      ""
                  )}
                  onChange={(event) =>
                    saveInstanceSetting(
                      props,
                      setting.settingsName,
                      event.target.value
                    )
                  }
                >
                  {setting.options.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </>
            )}
          </SettingsBox>
        ))}
    </>
  );
}

export default Instance_CustomSettings;
