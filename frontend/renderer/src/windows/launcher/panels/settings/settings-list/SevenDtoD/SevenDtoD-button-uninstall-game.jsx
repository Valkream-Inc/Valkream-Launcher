/**
 * @author Valkream Team
 * @license MIT-NC
 */

import { Button } from "@mui/material";
import { enqueueSnackbar } from "notistack";
import React, { useState } from "react";
import Wait from "../../../../component/wait/wait.jsx";
import { useAction } from "../../../../context/action.context.jsx";
import SettingsBox from "../../component/settings-box/settings-box.jsx";

const SevenDtoD_ButtonUninstallGame = () => {
  const { runAction } = useAction();
  const [isWaiting, setIsWaiting] = useState(false);
  const [progress, setProgress] = useState("");

  const handleClick = () => {
    runAction(async () => {
      try {
        setIsWaiting(true);
        await window.electron_SevenDtoD_API.uninstallGame();

        window.electron_SevenDtoD_API.onModsDataProgress((data) => {
          setProgress(
            `Analyse des mods en cours...
              ${data.percent}% (${data.processedBytes}/${data.totalBytes}) à ${data.speed}/s`
          );
        });

        await window.electron_SevenDtoD_API.getModsData();

        enqueueSnackbar("Jeu désinstallé !", { variant: "success" });
      } catch (error) {
        console.error(error);
        enqueueSnackbar("Jeu non désinstallé !", { variant: "error" });
      } finally {
        window.electron_SevenDtoD_API.removeModsDataListeners();
        setProgress("");
        setIsWaiting(false);
      }
    }, "uninstallGame");
  };

  return (
    <>
      <Wait isVisible={isWaiting} text={progress} />
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
    </>
  );
};

export default SevenDtoD_ButtonUninstallGame;
