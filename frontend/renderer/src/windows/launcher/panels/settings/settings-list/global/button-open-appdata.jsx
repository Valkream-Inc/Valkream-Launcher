/**
 * @author Valkream Team
 * @license MIT-NC
 */

import { Button } from "@mui/material";
import { enqueueSnackbar } from "notistack";
import React from "react";
import SettingsBox from "../../component/settings-box/settings-box.jsx";

const ButtonOpenAppData = () => {
  const handleClick = async () =>
    await window.electron_API
      .openAppData()
      .then(() => {
        enqueueSnackbar("AppData ouvert !", { variant: "success" });
      })
      .catch((error) => {
        console.error(error);
        enqueueSnackbar("AppData non ouvert !", { variant: "error" });
      });

  return (
    <SettingsBox
      warn={false}
      text="Vous pouvez ouvrir le dossier AppData de Valkream."
    >
      <Button
        variant="contained"
        size="large"
        sx={{ fontSize: "1.2rem" }}
        color="warning"
        onClick={handleClick}
      >
        Ouvrir le dossier AppData
      </Button>
    </SettingsBox>
  );
};

export default ButtonOpenAppData;
