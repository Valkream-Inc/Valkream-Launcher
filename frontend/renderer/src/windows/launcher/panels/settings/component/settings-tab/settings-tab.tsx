/**
 * @author Valkream Team
 * @license MIT-NC
 */

import "./settings-tab.css";

import { Box, Fade } from "@mui/material";
import type { SettingsTabProps } from "./settings-tab.types";

function SettingsTab({ id, activeTab, children }: SettingsTabProps) {
  return (
    <Fade in={activeTab === id} timeout={300}>
      <Box>
        <Box className="settings-tab-top-bar"></Box>
        <Box className="settings-tab">
          {children}
          <Box sx={{ minHeight: "1cm" }}></Box>
        </Box>
      </Box>
    </Fade>
  );
}

export default SettingsTab;
