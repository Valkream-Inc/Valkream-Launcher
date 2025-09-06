import React from "react";
import SettingsBox from "../component/settings-box/settings-box.jsx";
import { Button } from "@mui/material";
import { enqueueSnackbar } from "notistack";

const ButtonUninstallGame = () => {
  const handleClick = async () =>
    await window.electron_API
      .uninstallGame()
      .then(() => {
        enqueueSnackbar("Jeu désinstallé !", { variant: "success" });
      })
      .catch((error) => {
        console.error(error);
        enqueueSnackbar("Jeu non désinstallé !", { variant: "error" });
      });

  return (
    <SettingsBox
      warn={false}
      text="Vous pouvez supprimer les fichiers de jeux valkream."
    >
      <Button
        variant="contained"
        size="large"
        sx={{ fontSize: "1.2rem" }}
        color="error"
        onClick={handleClick}
      >
        Désinstaller le jeu
      </Button>
    </SettingsBox>
  );
};

export default ButtonUninstallGame;
