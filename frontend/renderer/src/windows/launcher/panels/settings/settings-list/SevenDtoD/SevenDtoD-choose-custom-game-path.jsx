/**
 * @author Valkream Team
 * @license MIT-NC
 */

import React, { useEffect, useState, useRef, useCallback } from "react";
import { Box, Button, TextField } from "@mui/material";
import { enqueueSnackbar } from "notistack";
import { useAction } from "../../../../context/action.context.jsx";
import SettingsBox from "../../component/settings-box/settings-box.jsx";

const SETTING_KEY = "gamePathWithSevenDtoD";
const ACTION_KEY = "SevenDtoD-select-game-path";

function SevenDtoD_ChooseCustomGamePath() {
  const [path, setPath] = useState("");
  const { actionLoading, currentKey } = useAction();
  const prevActionLoadingRef = useRef(false);
  const prevCurrentKeyRef = useRef(null);

  const loadSettings = useCallback(async () => {
    const customGamePath = await window.electron_API.getSettings(SETTING_KEY);
    setPath(customGamePath || "");
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    // met a jour le champ de saisie quand le chemin est modifié depuis le boutton principal
    // Détecte quand l'action de sélection du chemin de jeu se termine
    const wasActionLoading = prevActionLoadingRef.current;
    const wasCorrectKey = prevCurrentKeyRef.current === ACTION_KEY;
    const isActionFinished =
      wasActionLoading && !actionLoading && wasCorrectKey;

    if (isActionFinished) {
      loadSettings();
    }

    // Mettre à jour les références
    prevActionLoadingRef.current = actionLoading;
    prevCurrentKeyRef.current = currentKey;
  }, [actionLoading, currentKey, loadSettings]);

  const handleChoosePath = useCallback(async () => {
    try {
      const result = await window.electron_API.chooseFolder();
      if (!result || result === path) return;

      if (
        await window.electron_SevenDtoD_API.testIsSteamGamePathValid(result)
      ) {
        setPath(result);
        await window.electron_API.setSettings(SETTING_KEY, result);
        enqueueSnackbar("Chemin personnalisé sauvegardé !", {
          variant: "info",
        });
      } else {
        enqueueSnackbar("Chemin invalide !", { variant: "error" });
      }
    } catch (error) {
      console.error("Erreur lors du choix du chemin :", error);
      enqueueSnackbar("Erreur lors du choix du chemin", { variant: "error" });
    }
  }, [path]);

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
