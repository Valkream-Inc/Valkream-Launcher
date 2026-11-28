/**
 * @author Valkream Team
 * @license MIT-NC
 */


import type { LauncherThemeChangeEvent } from "../settings-list.types";
import type { LauncherTheme } from "@shared/types";
import { enqueueSnackbar } from "notistack";
import { useTheme } from "../../../../context/theme.context";
import {
  SelectItemSettings,
  SelectSettings,
} from "../../component/select-settings/select-settings";
import SettingsBox from "../../component/settings-box/settings-box";
import { useTranslation } from "react-i18next";

function SelectLauncherTheme() {
  const { t } = useTranslation();
  const { theme, changeTheme } = useTheme();

  const handleChange = async (event: LauncherThemeChangeEvent) => {
    const value = event.target.value as LauncherTheme;
    if (value === theme) return;

    await changeTheme(value);
    enqueueSnackbar(t("settings.theme.changed"), {
      variant: "info",
    });
  };

  return (
    <SettingsBox
      warn={false}
      text={t("settings.theme.text")}
    >
      <SelectSettings value={theme} onChange={handleChange}>
        <SelectItemSettings value="old">Old</SelectItemSettings>
        <SelectItemSettings value="modern">Modern</SelectItemSettings>
        <SelectItemSettings value="futuristic">Futuristic</SelectItemSettings>
      </SelectSettings>
    </SettingsBox>
  );
}

export default SelectLauncherTheme;
