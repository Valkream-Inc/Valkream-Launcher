/**
 * @author Valkream Team
 * @license MIT-NC
 */

import { Box, Fade } from "@mui/material";
import { memo } from "react";

import { usePanels } from "../../context/panels.context";
import { useAction } from "../../context/action.context";
import type { PanelProps } from "./panel.types";

function Panel({ id, children }: PanelProps) {
  const { activePanel } = usePanels();
  const { actionLoading } = useAction();

  return (
    <Fade
      in={activePanel === id}
      timeout={500}
      unmountOnExit={id !== "settings" && !actionLoading} // exclude settings for applying settings on launch
      mountOnEnter={id !== "settings" && !actionLoading} // exclude settings for applying settings on launch
      sx={{ PointerEvents: "none" }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: 0,
        }}
      >
        {children}
      </Box>
    </Fade>
  );
}

export default memo(Panel);
