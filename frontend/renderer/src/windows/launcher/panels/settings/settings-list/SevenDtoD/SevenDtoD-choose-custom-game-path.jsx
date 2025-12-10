/**
 * @author Valkream Team
 * @license MIT-NC
 */

import { Box, Button, TextField } from "@mui/material";
import { enqueueSnackbar } from "notistack";
import React, { useEffect, useState } from "react";
import SettingsBox from "../../component/settings-box/settings-box.jsx";

function SevenDtoD_ChooseCustomGamePath() {
  const [path, setPath] = useState("");

  useEffect(() => {
    const loadSettings = async () => {
      const customGamePath = await window.electron_API.getSettings(
        "gamePathWithSevenDtoD"
      );
      setPath(customGamePath || "");
    };

    loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChoosePath = async () => {
    try {
      const result = await window.electron_API.chooseFolder();
      if (result === path) return;
      setPath(result || "");
      await window.electron_API.setSettings("gamePathWithSevenDtoD", result);
      enqueueSnackbar("Chemin personnalisé sauvegardé !", { variant: "info" });
    } catch (error) {
      console.error("Erreur lors du choix du chemin :", error);
    }
  };

  return (
    <SettingsBox
      warn={false}
      text="Chemin personnalisé vers votre installation Steam de 7Days To Die:"
    >
      <Box
        display="flex"
        alignItems="center"
        gap={2}
        className="settings-elements content-center"
      >
        <TextField
          value={path}
          placeholder="Chemin du jeu..."
          variant="outlined"
          fullWidth
          InputProps={{
            readOnly: true,
            style: {
              background: "var(--background)",
              color: "var(--color)",
              borderRadius: "8px",
              border: "2px solid var(--color)",
            },
          }}
          className="custom-game-path"
        />

        <Button
          variant="contained"
          onClick={handleChoosePath}
          id="choose-game-path-btn"
        >
          Choisir...
        </Button>
      </Box>
    </SettingsBox>
  );
}

export default SevenDtoD_ChooseCustomGamePath;
