import React from "react";
import { Box, Fade } from "@mui/material";

import { usePanels } from "../../context/panels.context.jsx";

function Panel({ id, children }) {
  const { activePanel } = usePanels();

  return (
    <Fade in={activePanel === id} timeout={500} sx={{ PointerEvents: "none" }}>
      <Box sx={{ position: "absolute", inset: 0 }}>{children}</Box>
    </Fade>
  );
}

export default Panel;
