/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Réglages propres à un jeu, décrits par `customGamesSettings` (config render) et
 * stockés par installation (stable et beta ont chacun les leurs).
 */

import type { ToggleChangeEvent } from "../settings-list.types";
import { useState } from "react";
import { Box, MenuItem, Select, Slider, Switch, Typography } from "@mui/material";

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

/** Curseur : la valeur s'affiche en direct, mais n'est enregistrée qu'au relâchement (pas de rafale d'écritures). */
function SliderSetting({
  setting,
  props,
}: {
  setting: Extract<CustomGameSetting, { type: "slider" }>;
  props: InstanceSettingProps;
}) {
  const saved = Number(props.values[setting.settingsName] ?? setting.default ?? setting.min);
  const [dragging, setDragging] = useState<number | null>(null);
  const value = dragging ?? saved;

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 2, width: "100%", maxWidth: 420 }}>
      <Typography sx={{ whiteSpace: "nowrap" }}>{setting.label}</Typography>
      <Slider
        size="small"
        min={setting.min}
        max={setting.max}
        step={setting.step ?? 1}
        value={value}
        onChange={(_event, next) => setDragging(next as number)}
        onChangeCommitted={(_event, next) => {
          setDragging(null);
          if (next !== saved) void saveInstanceSetting(props, setting.settingsName, next as number);
        }}
      />
      <Typography sx={{ minWidth: 80, textAlign: "right" }}>
        {value}
        {setting.unit ? ` ${setting.unit}` : ""}
      </Typography>
    </Box>
  );
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
            ) : setting.type === "slider" ? (
              <SliderSetting setting={setting} props={props} />
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
