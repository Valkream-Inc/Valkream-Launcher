/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

import { Button } from "@mui/material";
import { enqueueSnackbar } from "notistack";
import React from "react";
import SettingsBox from "../../component/settings-box/settings-box.jsx";

const ButtonUninstallGlobal = () => {
  const handleClick = async () =>
    await window.electron_API
      .uninstallLauncher()
      .then(() => {
        enqueueSnackbar("Launcher désinstallé !", { variant: "success" });
      })
      .catch((error) => {
        console.error(error);
        enqueueSnackbar("Launcher non désinstallé !", { variant: "error" });
      });

  return (
    <SettingsBox
      warn={true}
      text="Vous voulez Désinstaller le launcher et Jeu ? Faites-le ici. Mais
        attention, vous perdrez ainsi tous les paramètres de jeux mais vous
        conserverez vos personnages."
    >
      <Button
        variant="contained"
        size="large"
        sx={{ fontSize: "1.2rem" }}
        color="error"
        onClick={handleClick}
      >
        Désinstaller
      </Button>
    </SettingsBox>
  );
};

export default ButtonUninstallGlobal;
