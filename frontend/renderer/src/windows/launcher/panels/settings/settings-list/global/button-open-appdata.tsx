/**
 * @author Valkream Team
 * @license MIT-NC
 */

import { Button } from "@mui/material";
import { enqueueSnackbar } from "notistack";
import SettingsBox from "../../component/settings-box/settings-box";
import { useTranslation } from "react-i18next";

const ButtonOpenAppData = () => {
  const { t } = useTranslation();
  const handleClick = async () =>
    await window.electron_API
      .openAppData()
      .then(() => {
        enqueueSnackbar(t("settings.appdata.opened"), { variant: "success" });
      })
      .catch((error) => {
        console.error(error);
        enqueueSnackbar(t("settings.appdata.notOpened"), { variant: "error" });
      });

  return (
    <SettingsBox
      warn={false}
      text={t("settings.appdata.text")}
    >
      <Button
        variant="contained"
        size="large"
        sx={{ fontSize: "1.2rem" }}
        color="warning"
        onClick={handleClick}
      >
        {t("settings.appdata.button")}
      </Button>
    </SettingsBox>
  );
};

export default ButtonOpenAppData;
