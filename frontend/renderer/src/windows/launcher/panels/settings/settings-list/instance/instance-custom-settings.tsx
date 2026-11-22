/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Réglages propres à un jeu, décrits par `customGamesSettings` (config render) et
 * stockés par installation (stable et beta ont chacun les leurs).
 */

import {
  Box,
  MenuItem,
  Select,
  Slider,
  Switch,
  Typography,
} from "@mui/material";
import { useState } from "react";
import type { ToggleChangeEvent } from "../settings-list.types";

import type {
  CustomGameSetting,
  SettingLevel,
  SettingZone,
} from "../../../../../../instances/instances.types";
import SettingsBox from "../../component/settings-box/settings-box";
import { saveInstanceSetting } from "./instance-save-setting";
import type { InstanceSettingProps } from "./instance-setting.types";
import { useTranslation } from "react-i18next";

interface Props extends InstanceSettingProps {
  settings: CustomGameSetting[];
  /** Seuls les réglages de ce niveau sont rendus. */
  level: SettingLevel;
  zone: SettingZone;
}

/** Curseur : la valeur s'affiche en direct, mais n'est enregistrée qu'au relâchement (pas de rafale d'écritures). */
function SliderSetting({
  setting,
  props,
}: {
  setting: Extract<CustomGameSetting, { type: "slider" }>;
  props: InstanceSettingProps;
}) {
  const { t } = useTranslation();
  const saved = Number(
    props.values[setting.settingsName] ?? setting.default ?? setting.min,
  );
  const [dragging, setDragging] = useState<number | null>(null);
  const value = dragging ?? saved;

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        width: "100%",
        maxWidth: 420,
      }}
    >
      <Typography sx={{ whiteSpace: "nowrap" }}>{t(setting.label, { defaultValue: setting.label })}</Typography>
      <Slider
        size="small"
        min={setting.min}
        max={setting.max}
        step={setting.step ?? 1}
        value={value}
        onChange={(_event, next) => setDragging(next as number)}
        onChangeCommitted={(_event, next) => {
          setDragging(null);
          if (next !== saved)
            void saveInstanceSetting(
              props,
              setting.settingsName,
              next as number,
              t("instance.settingValue", {
                label: t(setting.label, { defaultValue: setting.label }),
                value: `${next}${setting.unit ? ` ${setting.unit}` : ""}`,
              }),
            );
        }}
      />
      <Typography sx={{ minWidth: 80, textAlign: "right" }}>
        {value}
        {setting.unit ? ` ${setting.unit}` : ""}
      </Typography>
    </Box>
  );
}

function Instance_CustomSettings({ settings, level, zone, ...props }: Props) {
  const { t } = useTranslation();
  const { values } = props;
  /** Libellé traduit de l'option choisie (sa valeur brute si elle est inconnue). */
  const label = (setting: Extract<CustomGameSetting, { type: "select" }>, value: string) => {
    const option = setting.options.find((item) => item.value === value);
    return option ? t(option.label, { defaultValue: option.label }) : value;
  };

  return (
    <>
      {settings
        .filter(
          (setting) =>
            (setting.category?.level ?? "normal") === level &&
            (setting.category?.zone ?? "normal") === zone,
        )
        .map((setting) => (
          <SettingsBox
            key={setting.settingsName}
            warn={setting.category?.zone === "danger"}
            text={setting.text ? t(setting.text, { defaultValue: setting.text }) : undefined}
          >
            {setting.type === "toggle" ? (
              <>
                <Switch
                  checked={
                    (values[setting.settingsName] ??
                      setting.default ??
                      false) === true
                  }
                  onChange={(event: ToggleChangeEvent) =>
                    saveInstanceSetting(
                      props,
                      setting.settingsName,
                      event.target.checked,
                      t(event.target.checked ? "instance.settingOn" : "instance.settingOff", {
                        label: t(setting.label, { defaultValue: setting.label }),
                      }),
                    )
                  }
                />
                <span>{t(setting.label, { defaultValue: setting.label })}</span>
              </>
            ) : setting.type === "slider" ? (
              <SliderSetting setting={setting} props={props} />
            ) : (
              <>
                <span>{t(setting.label, { defaultValue: setting.label })}</span>
                <Select
                  size="small"
                  value={String(
                    values[setting.settingsName] ??
                      setting.default ??
                      setting.options[0]?.value ??
                      "",
                  )}
                  onChange={(event) =>
                    saveInstanceSetting(
                      props,
                      setting.settingsName,
                      event.target.value,
                      t("instance.settingValue", {
                        label: t(setting.label, { defaultValue: setting.label }),
                        value: label(setting, event.target.value),
                      }),
                    )
                  }
                >
                  {setting.options.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {t(option.label, { defaultValue: option.label })}
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
