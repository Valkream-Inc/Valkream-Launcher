/**
 * @author Valkream Team
 * @license MIT-NC
 */

import { Box, Fade } from "@mui/material";
import { memo } from "react";

import { usePanels } from "../../context/panels.context.jsx";
import { useAction } from "../../context/action.context.jsx";

function Panel({ id, children }) {
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
