import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import EventIcon from "@mui/icons-material/Event";
import InfoIcon from "@mui/icons-material/Info";
import LightbulbIcon from "@mui/icons-material/Lightbulb";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import WarningIcon from "@mui/icons-material/Warning";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Fade,
  Slide,
  Typography,
} from "@mui/material";
import React from "react";

const typeConfig = {
  info: {
    color: "#4da6ff",
    icon: <InfoIcon fontSize="large" />,
  },
  success: {
    color: "#4dff88",
    icon: <CheckCircleIcon fontSize="large" />,
  },
  warning: {
    color: "#ffbb33",
    icon: <WarningIcon fontSize="large" />,
  },
  error: {
    color: "#ff4d4d",
    icon: <ErrorIcon fontSize="large" />,
  },
  welcome: {
    color: "#66ffcc",
    icon: <RocketLaunchIcon fontSize="large" />,
  },
  event: {
    color: "#b366ff",
    icon: <EventIcon fontSize="large" />,
  },
  tips: {
    color: "#ffdd33", // jaune doré
    icon: <LightbulbIcon fontSize="large" />,
  },
};

// Transition combinée Slide + Fade
const Transition = React.forwardRef(function Transition(props, ref) {
  return (
    <Slide direction="down" ref={ref} {...props} timeout={500}>
      <Fade in={props.in} timeout={600}>
        {props.children}
      </Fade>
    </Slide>
  );
});

export default function ModernPopup({
  open,
  onClose,
  onConfirm,
  type = "info",
  title = "Titre du popup",
  message = "<p>Message du popup</p>",
}) {
  const { color, icon } = typeConfig[type] || typeConfig.info;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      TransitionComponent={Transition}
      keepMounted
      maxWidth="sm"
      fullWidth
      className="modern-theme"
      PaperProps={{
        sx: {
          background: "rgba(0,0,0,0.15)",
          backdropFilter: "blur(10px)",
          borderRadius: "20px",
          border: "1px solid rgba(255,255,255,0.15)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
          p: 2,
          maxHeight: "80vh",
        },
      }}
      sx={{
        "& .MuiDialog-container": {
          alignItems: "center",
          justifyContent: "center",
        },
      }}
    >
      <Box textAlign="center" color={color}>
        {icon}
      </Box>
      <DialogTitle sx={{ textAlign: "center", color, fontWeight: "bold" }}>
        {title}
      </DialogTitle>
      <DialogContent>
        <Typography
          variant="body1"
          textAlign="center"
          color="#e0e0e0"
          component="div"
        >
          {message}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ justifyContent: "center" }}>
        <Button
          onClick={(onConfirm && onConfirm[0]) || onClose}
          sx={{
            background: color,
            color: "#fff",
            borderRadius: "10px",
            px: 3,
            "&:hover": { opacity: 0.9 },
          }}
        >
          {(onConfirm && onConfirm[1]) || "OK"}
        </Button>
        {onConfirm && (
          <Button
            onClick={onClose}
            sx={{
              background: "#444",
              color: "#fff",
              borderRadius: "10px",
              px: 3,
              "&:hover": { background: "#555" },
            }}
          >
            Annuler
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
