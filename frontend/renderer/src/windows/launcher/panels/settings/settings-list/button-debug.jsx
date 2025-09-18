import React from "react";
import SettingsBox from "../component/settings-box/settings-box.jsx";
import { Button } from "@mui/material";
import { enqueueSnackbar } from "notistack";

const ButtonDebug = () => {
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
      text="Vous pouvez ouvrir le debug (⚠️: cela doit etre fait uniquement dans un
        but de debug et avec des personnes qualifiés :) )"
    >
      <Button
        variant="contained"
        size="large"
        sx={{ fontSize: "1.2rem" }}
        color="secondary"
        onClick={handleClick}
      >
        Ouvrir le debug
      </Button>
    </SettingsBox>
  );
};

export default ButtonDebug;
