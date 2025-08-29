import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Slide,
  Fade,
  Box,
  Typography,
} from "@mui/material";
import { keyframes } from "@mui/system";

// Icônes
import InfoIcon from "@mui/icons-material/Info";
import WarningIcon from "@mui/icons-material/Warning";
import ErrorIcon from "@mui/icons-material/Error";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import EventIcon from "@mui/icons-material/Event";
import LightbulbIcon from "@mui/icons-material/Lightbulb";

const flicker = keyframes`
  0%, 18%, 22%, 25%, 53%, 57%, 100% { opacity: 1; }
  20%, 24%, 55% { opacity: 0.4; }
`;

// Configurations par type (alignées avec ton HTML)
const typeConfig = {
  info: {
    color: "#33aaff",
    icon: <InfoIcon fontSize="inherit" />,
    iconSize: 60,
    titleSize: "2rem",
    textSize: "1.2rem",
  },
  success: {
    color: "#4dff88",
    icon: <CheckCircleIcon fontSize="inherit" />,
    iconSize: 80,
    titleSize: "2.2rem",
    textSize: "1.2rem",
  },
  warning: {
    color: "#ffbb33",
    icon: <WarningIcon fontSize="inherit" />,
    iconSize: 65,
    titleSize: "2.2rem",
    textSize: "1.2rem",
  },
  error: {
    color: "#ff4d4d",
    icon: <ErrorIcon fontSize="inherit" />,
    iconSize: 60,
    titleSize: "2rem",
    textSize: "1.2rem",
  },
  event: {
    color: "#ff33cc",
    icon: <EventIcon fontSize="inherit" />,
    iconSize: 70,
    titleSize: "2.5rem",
    textSize: "1.3rem",
  },
  tips: {
    color: "#ffaa33",
    icon: <LightbulbIcon fontSize="inherit" />,
    iconSize: 65,
    titleSize: "2rem",
    textSize: "1.2rem",
  },
  welcome: {
    color: "#00eaff",
    icon: <RocketLaunchIcon fontSize="inherit" />,
    iconSize: 80,
    titleSize: "2.2rem",
    textSize: "1.2rem",
  },
};

const decorationsConfig = {
  info: {
    lines: [
      { top: -20, left: "20%", width: "50%", height: 3 },
      { right: -20, top: "20%", height: "50%", width: 3 },
      { bottom: -20, right: "20%", width: "60%", height: 3 },
      { left: -20, bottom: "20%", height: "40%", width: 3 },
    ],
    nodes: [],
  },
  success: {
    lines: [
      // bandes côté gauche
      {
        left: -35,
        top: "10%",
        height: 120,
        width: 3,
        transform: "rotate(15deg)",
      },
      {
        left: -35,
        top: "40%",
        height: 120,
        width: 3,
        transform: "rotate(-15deg)",
      },
      {
        left: -35,
        top: "70%",
        height: 120,
        width: 3,
        transform: "rotate(15deg)",
      },

      // bandes côté droit
      {
        right: -35,
        top: "15%",
        height: 120,
        width: 3,
        transform: "rotate(-15deg)",
      },
      {
        right: -35,
        top: "45%",
        height: 120,
        width: 3,
        transform: "rotate(15deg)",
      },
      {
        right: -35,
        top: "75%",
        height: 120,
        width: 3,
        transform: "rotate(-15deg)",
      },
    ],
    nodes: [
      { left: -40, top: "10%" },
      { left: -40, bottom: "15%" },
      { right: -40, top: "20%" },
      { right: -40, bottom: "10%" },
    ],
  },
  error: {
    lines: [
      {
        top: -35,
        left: -35,
        width: 160,
        height: 3,
        transform: "rotate(45deg)",
      },
      {
        top: -35,
        right: -35,
        width: 160,
        height: 3,
        transform: "rotate(-45deg)",
      },
      {
        bottom: -35,
        left: -35,
        width: 160,
        height: 3,
        transform: "rotate(-45deg)",
      },
      {
        bottom: -35,
        right: -35,
        width: 160,
        height: 3,
        transform: "rotate(45deg)",
      },
    ],
    nodes: [
      { top: -40, left: "50%" },
      { bottom: -40, left: "50%" },
      { left: -40, top: "50%" },
      { right: -40, top: "50%" },
    ],
  },
  warning: {
    lines: [
      // bandes diagonales hautes
      {
        top: -35,
        left: "5%",
        width: 120,
        height: 3,
        transform: "rotate(25deg)",
      },
      {
        top: -35,
        left: "45%",
        width: 120,
        height: 3,
        transform: "rotate(25deg)",
      },
      {
        top: -35,
        left: "75%",
        width: 120,
        height: 3,
        transform: "rotate(25deg)",
      },

      // bandes diagonales basses
      {
        bottom: -35,
        left: "10%",
        width: 120,
        height: 3,
        transform: "rotate(-25deg)",
      },
      {
        bottom: -35,
        left: "40%",
        width: 120,
        height: 3,
        transform: "rotate(-25deg)",
      },
      {
        bottom: -35,
        left: "70%",
        width: 120,
        height: 3,
        transform: "rotate(-25deg)",
      },
    ],
    nodes: [
      { top: -40, left: "5%" },
      { top: -40, right: "5%" },
      { bottom: -40, left: "5%" },
      { bottom: -40, right: "5%" },
    ],
  },
  event: {
    lines: [
      { top: -25, left: "15%", width: "70%", height: 3 },
      { bottom: -25, left: "20%", width: "60%", height: 3 },
      { top: "20%", left: -25, height: "60%", width: 3 },
      { top: "25%", right: -25, height: "50%", width: 3 },
    ],
    nodes: [
      { top: -25, left: "15%" },
      { top: -25, right: "15%" },
      { bottom: -25, left: "20%" },
      { bottom: -25, right: "20%" },
      { top: "25%", left: -25 },
      { bottom: "25%", right: -25 },
    ],
  },
  tips: {
    lines: [
      {
        top: -30,
        left: -30,
        width: 150,
        height: 3,
        transform: "rotate(45deg)",
      },
      {
        bottom: -30,
        right: -30,
        width: 180,
        height: 3,
        transform: "rotate(-45deg)",
      },
      {
        top: -40,
        right: "20%",
        width: 120,
        height: 3,
        transform: "rotate(-20deg)",
      },
      {
        bottom: -40,
        left: "25%",
        width: 140,
        height: 3,
        transform: "rotate(20deg)",
      },
    ],
    nodes: [
      { top: -35, left: -35 },
      { bottom: -35, right: -35 },
      { top: -45, right: "20%" },
      { bottom: -45, left: "25%" },
    ],
  },
  welcome: {
    lines: [
      { top: -25, left: "10%", width: "80%", height: 3 },
      { bottom: -25, left: "15%", width: "70%", height: 3 },
      { left: -25, top: "20%", height: "60%", width: 3 },
      { right: -25, top: "30%", height: "40%", width: 3 },
    ],
    nodes: [
      { top: -30, left: "10%" },
      { bottom: -30, left: "80%" },
      { left: -30, top: "20%" },
      { right: -30, top: "70%" },
    ],
  },
};

const baseLineStyle = (color) => ({
  position: "absolute",
  background: color,
  boxShadow: `0 0 15px ${color}, 0 0 30px ${color}`,
  animation: `${flicker} 4s infinite`,
});

const baseNodeStyle = (color, size = 12) => ({
  position: "absolute",
  background: color,
  boxShadow: `0 0 15px ${color}, 0 0 30px ${color}`,
  animation: `${flicker} 4s infinite`,
  borderRadius: "50%",
  width: size,
  height: size,
});

function PopupDecoration({ type }) {
  const color = typeConfig[type]?.color || typeConfig.info.color;
  const selectedDecorations = decorationsConfig[type] || {
    lines: [],
    nodes: [],
  };

  // Ajuster la taille des nodes comme dans le CSS HTML
  const nodeSize =
    type === "event" ? 14 : type === "tip" || type === "welcome" ? 12 : 0;

  return (
    <Box>
      {selectedDecorations.lines.map((deco, index) => (
        <Box key={`line-${index}`} sx={{ ...baseLineStyle(color), ...deco }} />
      ))}
      {selectedDecorations.nodes.map((deco, index) => (
        <Box
          key={`node-${index}`}
          sx={{ ...baseNodeStyle(color, nodeSize), ...deco }}
        />
      ))}
    </Box>
  );
}

const Transition = React.forwardRef(function Transition(props, ref) {
  return (
    <Slide direction="down" ref={ref} {...props} timeout={500}>
      <Fade in={props.in} timeout={600}>
        {props.children}
      </Fade>
    </Slide>
  );
});

export default function FuturisticPopup({
  open,
  onClose,
  type = "info",
  title = "Titre du popup",
  message = "Message du popup",
  buttons = [{ text: "OK", action: onClose }],
}) {
  const { color, icon, iconSize, titleSize } =
    typeConfig[type] || typeConfig.info;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      TransitionComponent={Transition}
      keepMounted
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          position: "relative",
          background: "#0f0f0f",
          textAlign: "center",
          borderRadius: "18px",
          border: `3px solid ${color}`,
          boxShadow: `0 0 40px ${color}, inset 0 0 20px rgba(255,255,255,0.1)`,
          p: 2,
          color: "white",
          overflow: "visible", // ✅ autoriser le dépassement
        },
      }}
    >
      {/* Contenu normal du popup */}
      <Box sx={{ position: "relative", zIndex: 1 }}>
        <Box
          sx={{
            color,
            textShadow: `0 0 20px ${color}, 0 0 40px ${color}`,
            fontSize: iconSize,
            mb: 2,
          }}
        >
          {icon}
        </Box>
        <DialogTitle
          sx={{
            textAlign: "center",
            color,
            textShadow: `0 0 15px ${color}`,
            fontWeight: "bold",
            fontSize: titleSize,
            "&.MuiDialogTitle-root": { p: 0, mb: 2 },
          }}
        >
          {title}
        </DialogTitle>
        <DialogContent sx={{ overflow: "visible" }}>
          <Typography
            variant="body1"
            textAlign="center"
            color="#e0e0e0"
            component="div"
            className="futuristic-theme"
            sx={{
              mt: 2,
              mb: 2,
              lineHeight: 1.6,
              maxHeight: "calc(80vh - 10cm)",
              overflowY: "auto",
            }}
          >
            {message}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", gap: 2, mt: 2 }}>
          {buttons.map((btn, i) => (
            <Button
              key={i}
              onClick={btn.action}
              sx={{
                background: "transparent",
                border: `2px solid ${color}`,
                color,
                transition: "0.3s",
                textShadow: `0 0 10px ${color}`,
                px: 3,
                py: 1,
                borderRadius: "10px",
                fontSize: "1.1rem",
                "&:hover": {
                  background: color,
                  color: "black",
                  boxShadow: `0 0 15px ${color}`,
                },
              }}
            >
              {btn.text}
            </Button>
          ))}
        </DialogActions>
      </Box>

      {/* Décorations derrière */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
        }}
      >
        <PopupDecoration type={type} />
      </Box>
    </Dialog>
  );
}
