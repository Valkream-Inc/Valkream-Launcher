/**
 * @author Valkream Team
 * @license MIT-NC
 */


import { enqueueSnackbar } from "notistack";
import { useTheme } from "../../../../context/theme.context";
import {
  SelectItemSettings,
  SelectSettings,
} from "../../component/select-settings/select-settings";
import SettingsBox from "../../component/settings-box/settings-box";

function SelectLauncherTheme() {
  const { theme, changeTheme } = useTheme();

  const handleChange = async (event) => {
    const value = event.target.value;
    if (value === theme) return;

    await changeTheme(value);
    enqueueSnackbar("Vous avez changé le theme du launcher !", {
      variant: "info",
    });
  };

  return (
    <SettingsBox
      warn={false}
      text="Vous voulez changer le theme du launcher ? Faites-le ici."
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
