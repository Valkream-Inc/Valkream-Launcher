/**
 * @author Valkream Team
 * @license MIT-NC
 */

import { Box, Fade } from "@mui/material";

import { useAction } from "../../context/action.context";
import { usePanels } from "../../context/panels.context";
import type { PanelProps } from "./panel.types";

function Panel({ id, children }: PanelProps) {
  const { activePanel } = usePanels();
  const { actionLoading, keepAlive } = useAction();
  // Une tâche en cours (action ou téléchargement de fond) garde les panneaux montés : changer de thème ou ouvrir
  // les réglages ne doit jamais l'interrompre.
  const busy = actionLoading || keepAlive;

  return (
    <Fade
      in={activePanel === id}
      timeout={500}
      unmountOnExit={id !== "settings" && !busy} // exclude settings for applying settings on launch
      mountOnEnter={id !== "settings" && !busy} // exclude settings for applying settings on launch
    >
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          maxWidth:
            activePanel === "home" ||
            (activePanel === "settings" && activePanel !== id)
              ? 0
              : undefined,
          overflow: activePanel !== id ? "hidden" : undefined,
        }}
      >
        {children}
      </Box>
    </Fade>
  );
}

export default Panel;
