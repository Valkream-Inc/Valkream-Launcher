/**
 * @author Valkream Team
 * @license MIT-NC
 */

import { Button } from "@mui/material";
import { enqueueSnackbar } from "notistack";
import SettingsBox from "../../component/settings-box/settings-box";
import { useTranslation } from "react-i18next";

const ButtonUninstallGlobal = () => {
  const { t } = useTranslation();
  const handleClick = async () =>
    await window.electron_API
      .uninstallLauncher()
      .then(() => {
        enqueueSnackbar(t("settings.uninstallLauncher.done"), { variant: "success" });
      })
      .catch((error) => {
        console.error(error);
        enqueueSnackbar(t("settings.uninstallLauncher.failed"), { variant: "error" });
      });

  return (
    <SettingsBox
      warn={true}
      text={t("settings.uninstallLauncher.text")}
    >
      <Button
        variant="contained"
        size="large"
        sx={{ fontSize: "1.2rem" }}
        color="error"
        onClick={handleClick}
      >
        {t("settings.uninstallLauncher.button")}
      </Button>
    </SettingsBox>
  );
};

export default ButtonUninstallGlobal;
