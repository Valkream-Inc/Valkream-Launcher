/**
 * @author Valkream Team
 * @license MIT-NC
 */

import { Button } from "@mui/material";
import { enqueueSnackbar } from "notistack";
import SettingsBox from "../../component/settings-box/settings-box";
import { useTranslation } from "react-i18next";

const ButtonDebug = () => {
  const { t } = useTranslation();
  const handleClick = async () =>
    await window.electron_API
      .openDevTools()
      .then(() => {
        enqueueSnackbar("Debug ouvert !", { variant: "success" });
      })
      .catch((error) => {
        console.error(error);
        enqueueSnackbar("Debug non ouvert !", { variant: "error" });
      });

  return (
    <SettingsBox
      warn={true}
      text={t("settings.debug.text")}
    >
      <Button
        variant="contained"
        size="large"
        sx={{ fontSize: "1.2rem" }}
        color="secondary"
        onClick={handleClick}
      >
        {t("settings.debug.button")}
      </Button>
    </SettingsBox>
  );
};

export default ButtonDebug;
