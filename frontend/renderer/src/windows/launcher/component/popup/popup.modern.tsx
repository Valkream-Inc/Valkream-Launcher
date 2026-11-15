/**
 * @author Valkream Team
 * @license MIT-NC
 */

import React, { memo } from "react";
import Dialog from "@mui/material/Dialog";
import Slide from "@mui/material/Slide";
import {
  Box,
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";

import { typeConfig } from "./component/popup.config";
import { createButtons } from "./component/popup.button";

function getModernTypeConfig(type) {
  const c = typeConfig[type] || typeConfig.info;
  return {
    color: c.color.modern,
    icon: c.icon.modern,
  };
}

// Transition Slide
const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="down" ref={ref} timeout={500} {...props} />;
});

export default memo(function ModernPopup({
  open,
  onClose,
  onConfirm,
  type = "info",
  title = "Titre du popup",
  message = "<p>Message du popup</p>",
}) {
  const { color, icon } = getModernTypeConfig(type);
  const buttons = createButtons(onClose, onConfirm);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      slots={{ transition: Transition }}
      keepMounted
      maxWidth="sm"
      fullWidth
      className="modern-theme"
      slotProps={{
        paper: {
          sx: {
            background: "rgba(0,0,0,0.15)",
            backdropFilter: "blur(10px)",
            borderRadius: "20px",
            border: "1px solid rgba(255,255,255,0.15)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
            p: 2,
            maxHeight: "80vh",
            // Transition Fade
            opacity: open ? 1 : 0,
            transition: "opacity 600ms ease",
          },
        },
      }}
      sx={{
        "& .MuiDialog-container": {
          alignItems: "center",
          justifyContent: "center",
        },
      }}
    >
      <Box sx={{ textAlign: "center", color: color }}>{icon}</Box>
      <DialogTitle sx={{ textAlign: "center", color, fontWeight: "bold" }}>
        {title}
      </DialogTitle>
      <DialogContent>
        <Typography
          variant="body1"
          sx={{ color: "#e0e0e0", textAlign: "center" }}
          component="div"
        >
          {message}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ justifyContent: "center" }}>
        {buttons.map((button, index) => (
          <Button
            key={index}
            onClick={button.action}
            sx={{
              background: button.variant === "main" ? color : "#444",
              color: "#fff",
              borderRadius: "10px",
              px: 3,
              "&:hover": {
                opacity: 0.9,
                background: button.variant === "main" ? color : "#555",
              },
            }}
          >
            {button.text}
          </Button>
        ))}
      </DialogActions>
    </Dialog>
  );
});
