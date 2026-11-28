/**
 * @author Valkream Team
 * @license MIT-NC
 */


import type { BackgroundTypeChangeEvent } from "../settings-list.types";
import type { BackgroundType } from "@shared/types";
import { enqueueSnackbar } from "notistack";
import { useBackground } from "../../../../context/background.context";
import {
  SelectItemSettings,
  SelectSettings,
} from "../../component/select-settings/select-settings";
import SettingsBox from "../../component/settings-box/settings-box";
import { useTranslation } from "react-i18next";

function SelectLauncherBackgroundType() {
  const { t } = useTranslation();
  const { backgroundType, changeBackgroundType } = useBackground();

  const handleChange = async (event: BackgroundTypeChangeEvent) => {
    const value = event.target.value as BackgroundType;
    if (value === backgroundType) return;

    await changeBackgroundType(value);
    enqueueSnackbar(t("settings.background.changed"), {
      variant: "info",
    });
  };

  return (
    <SettingsBox
      warn={false}
      text={t("settings.background.text")}
    >
      <SelectSettings value={backgroundType} onChange={handleChange}>
        <SelectItemSettings value="video">{t("settings.background.video")}</SelectItemSettings>
        <SelectItemSettings value="image">{t("settings.background.image")}</SelectItemSettings>
        <SelectItemSettings value="3d">
          {t("settings.background.threeD")}
        </SelectItemSettings>
      </SelectSettings>
    </SettingsBox>
  );
}

export default SelectLauncherBackgroundType;
