/**
 * @author Valkream Team
 * @license MIT-NC
 */

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { keyframes } from "@mui/system";
import React, { forwardRef, useImperativeHandle, useState } from "react";

import { useTheme } from "../../../context/theme.context.jsx";
import getModsThemeStyles from "./components/ModsStyle.jsx";
import ModsSyncTable from "./components/ModsSyncTable";

const pulse = keyframes`
    0%, 100% { opacity: 1; }
    50% { opacity: .5; }
  `;
const WaitPulse = ({ children, isLoading }) => (
  <Box sx={isLoading ? { animation: `${pulse} 1.5s infinite` } : {}}>
    {children}
  </Box>
);

const SevenDtotD_ModsTab = forwardRef((props, ref) => {
  const { theme } = useTheme();
  const themeStyles = getModsThemeStyles(theme);

  const [isLoading, setIsLoading] = useState(false);
  const [modsToDisplay, setModsToDisplay] = useState([]);

  const fetchMods = async () => {
    setIsLoading(true);
    setModsToDisplay({});
    try {
      setModsToDisplay(await window.electron_SevenDtoD_API.getModsData());
    } catch (err) {
      console.error(err);
    }
    setTimeout(() => {
      setIsLoading(false);
    }, 1500);
  };

  useImperativeHandle(ref, () => ({
    reload: () => fetchMods(),
    freeze: () => {},
    stop: () => {},
  }));

  const DynamicSettingsTitle = ({ children }) => (
    <Typography
      variant="h5"
      component="h2"
      sx={{
        fontWeight: "bold",
        mb: 2,
        color: themeStyles.textPrimary,
        fontFamily: themeStyles.fontFamily,
      }}
    >
      {children}
    </Typography>
  );

  return (
    <Box
      sx={{
        p: 3,
        bgcolor: themeStyles.mainBg,
        color: themeStyles.textPrimary,
        borderRadius: 2,
        boxShadow: themeStyles.boxShadow,
        maxWidth: "90%",
        mx: "auto",
        my: 4,
        fontFamily: themeStyles.fontFamily,
      }}
    >
      <DynamicSettingsTitle>
        Statut de Synchronisation des Mods
      </DynamicSettingsTitle>

      <WaitPulse isLoading={isLoading}>
        <ModsSyncTable
          modsToDisplay={modsToDisplay}
          theme={theme}
          themeStyles={themeStyles}
        />
      </WaitPulse>
    </Box>
  );
});

export default SevenDtotD_ModsTab;
