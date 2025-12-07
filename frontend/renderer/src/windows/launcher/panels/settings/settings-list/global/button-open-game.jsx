/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

import { Button } from "@mui/material";
import { enqueueSnackbar } from "notistack";
import React from "react";
import SettingsBox from "../../component/settings-box/settings-box.jsx";

const ButtonOpenGame = () => {
  const handleClick = async () =>
    await window.electron_API
      .openGameFolder()
      .then(() => {
        enqueueSnackbar("Dossier du jeu ouvert !", { variant: "success" });
      })
      .catch((error) => {
        console.error(error);
        enqueueSnackbar("Dossier du jeu non ouvert !", { variant: "error" });
      });

  return (
    <SettingsBox
      warn={false}
      text="Vous pouvez ouvrir le dossier du jeu de Valkream."
    >
      <Button
        variant="contained"
        size="large"
        sx={{ fontSize: "1.2rem" }}
        color="warning"
        onClick={handleClick}
      >
        Ouvrir le dossier du jeu
      </Button>
    </SettingsBox>
  );
};

export default ButtonOpenGame;
