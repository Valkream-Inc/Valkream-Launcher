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
          {/* Le zoom s'applique au contenu, pas au conteneur qui défile (sinon la hauteur déborde) */}
          <Box className="settings-tab-content">
            {children}
            <Box sx={{ minHeight: "1cm" }}></Box>
          </Box>
        </Box>
      </Box>
    </Fade>
  );
}

export default SettingsTab;
