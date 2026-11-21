/**
 * @author Valkream Team
 * @license MIT-NC
 */

import { Button } from "@mui/material";
import { enqueueSnackbar } from "notistack";
import { useState } from "react";
import Wait from "../../../../component/wait/wait";
import { useAction } from "../../../../context/action.context";
import SettingsBox from "../../component/settings-box/settings-box";
import type { InstanceButtonProps } from "./instance-setting.types";
import { useTranslation } from "react-i18next";

const Instance_ButtonUninstallGame = ({
  id,
  channel,
  onDone = () => {},
}: InstanceButtonProps) => {
  const { t } = useTranslation();
  const { runAction } = useAction();
  const [isWaiting, setIsWaiting] = useState(false);

  const handleClick = () => {
    runAction(async () => {
      try {
        setIsWaiting(true);
        await window.electron_API.uninstallInstance(id, channel);
        enqueueSnackbar(t("instance.uninstall.done"), { variant: "success" });
        onDone();
      } catch (error) {
        console.error(error);
        enqueueSnackbar(t("instance.uninstall.failed"), { variant: "error" });
      } finally {
        setIsWaiting(false);
      }
    }, "uninstallGame");
  };

  return (
    <>
      <Wait isVisible={isWaiting} />
      <SettingsBox
        warn={false}
        text={t("instance.uninstall.text")}
      >
        <Button
          variant="contained"
          size="large"
          sx={{ fontSize: "1.2rem" }}
          color="error"
          onClick={handleClick}
        >
          {t("instance.uninstall.button")}
        </Button>
      </SettingsBox>
    </>
  );
};

export default Instance_ButtonUninstallGame;
