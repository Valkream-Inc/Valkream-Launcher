/**
 * @author Valkream Team
 * @license MIT-NC
 */

import React from "react";
import "./settings-tab.css";

import { Box, Fade } from "@mui/material";

function SettingsTab({ id, activeTab, children }) {
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
