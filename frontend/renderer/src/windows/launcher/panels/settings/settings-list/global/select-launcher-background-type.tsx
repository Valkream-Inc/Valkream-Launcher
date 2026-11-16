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

function SelectLauncherBackgroundType() {
  const { backgroundType, changeBackgroundType } = useBackground();

  const handleChange = async (event: BackgroundTypeChangeEvent) => {
    const value = event.target.value as BackgroundType;
    if (value === backgroundType) return;

    await changeBackgroundType(value);
    enqueueSnackbar("Vous avez changé le Fond d'écran du launcher !", {
      variant: "info",
    });
  };

  return (
    <SettingsBox
      warn={false}
      text="Vous voulez changer le Fonds d'écran du launcher ? C'est ici !"
    >
      <SelectSettings value={backgroundType} onChange={handleChange}>
        <SelectItemSettings value="video">Video</SelectItemSettings>
        <SelectItemSettings value="image">Image</SelectItemSettings>
        <SelectItemSettings value="3d">
          3d (PC performant nécessaire)
        </SelectItemSettings>
      </SelectSettings>
    </SettingsBox>
  );
}

export default SelectLauncherBackgroundType;
