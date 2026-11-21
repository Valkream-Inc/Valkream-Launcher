/**
 * @author Valkream Team
 * @license MIT-NC
 */

import { Button } from "@mui/material";
import { enqueueSnackbar } from "notistack";

import SettingsBox from "../../component/settings-box/settings-box";
import type { InstanceButtonProps } from "./instance-setting.types";
import { useTranslation } from "react-i18next";

const Instance_ButtonOpenGame = ({ id, channel }: InstanceButtonProps) => {
  const { t } = useTranslation();
  const handleClick = async () =>
    await window.electron_API
      .openInstanceFolder(id, channel)
      .then(() => {
        enqueueSnackbar(t("instance.openGame.opened"), { variant: "success" });
      })
      .catch((error) => {
        console.error(error);
        enqueueSnackbar(t("instance.openGame.notOpened"), { variant: "error" });
      });

  return (
    <SettingsBox
      warn={false}
      text={t("instance.openGame.text")}
    >
      <Button
        variant="contained"
        size="large"
        sx={{ fontSize: "1.2rem" }}
        color="warning"
        onClick={handleClick}
      >
        {t("instance.openGame.button")}
      </Button>
    </SettingsBox>
  );
};

export default Instance_ButtonOpenGame;
