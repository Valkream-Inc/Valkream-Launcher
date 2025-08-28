import React from "react";
import "./settings-tab.css";

import { Box, Fade } from "@mui/material";

function SettingsTab({ id, activeTab, children }) {
  return (
    <Fade in={activeTab === id} timeout={300}>
      <Box className="settings-tab">{children}</Box>
    </Fade>
  );
}

export default SettingsTab;
