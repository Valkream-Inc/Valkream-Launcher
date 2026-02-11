/**
 * @author Valkream Team
 * @license MIT-NC
 */

import { enqueueSnackbar } from "notistack";
import React, { useEffect, useState } from "react";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";

import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import HandymanIcon from "@mui/icons-material/Handyman";
import SearchIcon from "@mui/icons-material/Search";

import Wait from "../../../../component/wait/wait.jsx";

const ModsSyncToolbar = ({
  searchTerm,
  onSearchChange,
  themeStyles,
  modsToDisplay,
}) => {
  const [tempValue, setTempValue] = useState(searchTerm);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const handler = setTimeout(() => {
      onSearchChange(tempValue);
    }, 1000);

    return () => clearTimeout(handler);
  }, [tempValue]);

  const handleKeyPress = (e) =>
    e.key === "Enter" ? onSearchChange(tempValue) : {};

  const handleCopyLocalHashes = async () => {
    setIsLoading(true);
    const localHashes = await window.electron_SevenDtoD_API.getLocalHashData();
    navigator.clipboard
      .writeText(localHashes)
      .then(() => enqueueSnackbar("Hashes copiés !", { variant: "info" }))
      .finally(() => setIsLoading(false));
  };

  const handleFixMods = async () => {
    setIsLoading(true);

    try {
      window.electron_SevenDtoD_API.onFixModsProgress((data) => {
        enqueueSnackbar(data.text, { variant: "info" });
      });
      window.electron_SevenDtoD_API.onFixModsError((data) => {
        enqueueSnackbar(data.message, { variant: "error" });
        console.log(data);
      });

      await window.electron_SevenDtoD_API.fixMods();
    } catch (err) {
      console.error(err);
    } finally {
      window.electron_SevenDtoD_API.removeFixModsListeners();
      setIsLoading(false);
    }
  };

  return (
    <>
      <Wait isVisible={isLoading} />
      <Box
        sx={{
          p: 1.5,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: `1px solid ${themeStyles.borderColor}`,
          bgcolor: themeStyles.headerBg,
        }}
      >
        <TextField
          variant="outlined"
          size="small"
          placeholder="Rechercher par chemin ou hash..."
          value={tempValue}
          onChange={(e) => setTempValue(e.target.value)}
          onKeyDown={handleKeyPress}
          sx={{
            flexGrow: 1,
            maxWidth: "400px",
            "& .MuiOutlinedInput-root": {
              color: themeStyles.textPrimary,
              backgroundColor: themeStyles.tableBg,
              fontFamily: themeStyles.fontFamily,
              "& fieldset": {
                borderColor: themeStyles.borderColor,
              },
              "&:hover fieldset": {
                borderColor: themeStyles.textPrimary,
              },
            },
            "& .MuiInputLabel-root": {
              color: themeStyles.textSecondary,
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: themeStyles.textSecondary }} />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <Box
                  sx={{
                    bgcolor: themeStyles.textPrimary,
                    color: themeStyles.mainBg,
                    px: 1,
                    borderRadius: "10px",
                    fontSize: "0.75rem",
                    fontWeight: "bold",
                    minWidth: "24px",
                    textAlign: "center",
                    opacity: 0.9,
                  }}
                >
                  {modsToDisplay.length}
                </Box>
              </InputAdornment>
            ),
          }}
        />
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, ml: 2 }}>
          <Button
            variant="contained"
            onClick={handleCopyLocalHashes}
            startIcon={<ContentCopyIcon />}
            sx={{
              bgcolor: themeStyles.textPrimary,
              color: themeStyles.mainBg,
            }}
          >
            Copier Hashes
          </Button>
          <Tooltip title="Fix">
            <IconButton
              onClick={handleFixMods}
              sx={{
                bgcolor: themeStyles.textPrimary,
                color: themeStyles.mainBg,
                "&:hover": {
                  bgcolor: themeStyles.textPrimary,
                  opacity: 0.9,
                },
              }}
            >
              <HandymanIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </>
  );
};

export default ModsSyncToolbar;
