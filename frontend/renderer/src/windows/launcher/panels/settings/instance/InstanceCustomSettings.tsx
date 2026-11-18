/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Réglages propres à un jeu, décrits par `customGamesSettings` (config render) et
 * stockés par installation (stable et beta ont chacun les leurs).
 */

import { MenuItem, Select, Switch } from "@mui/material";
import { enqueueSnackbar } from "notistack";

import type { Channel, InstanceId, InstanceSettingValue } from "@shared/types";

import type { CustomGameSetting } from "../../../../../instances/instances.types";
import SettingsBox from "../component/settings-box/settings-box";

interface Props {
  id: InstanceId;
  channel: Channel;
  settings: CustomGameSetting[];
  values: Record<string, InstanceSettingValue>;
  /** Appelé avec les réglages à jour après une sauvegarde. */
  onChange: (values: Record<string, InstanceSettingValue>) => void;
}

export default function InstanceCustomSettings({ id, channel, settings, values, onChange }: Props) {
  const save = async (name: string, value: InstanceSettingValue) => {
    try {
      onChange(await window.electron_API.setInstanceSetting(id, channel, name, value));
    } catch (error) {
      console.error(error);
      enqueueSnackbar("Réglage non enregistré !", { variant: "error" });
    }
  };

  return (
    <>
      {settings.map((setting) => (
        <SettingsBox key={setting.settingsName} warn={false}>
          {setting.type === "toggle" ? (
            <>
              <Switch
                checked={(values[setting.settingsName] ?? setting.default ?? false) === true}
                onChange={(event) => save(setting.settingsName, event.target.checked)}
              />
              <span>{setting.label}</span>
            </>
          ) : (
            <>
              <span>{setting.label}</span>
              <Select
                size="small"
                value={String(values[setting.settingsName] ?? setting.default ?? setting.options[0]?.value ?? "")}
                onChange={(event) => save(setting.settingsName, event.target.value)}
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
