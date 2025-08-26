import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Box,
  Slide,
  Fade,
} from "@mui/material";
import { keyframes } from "@mui/system";
import InfoIcon from "@mui/icons-material/Info";
import WarningIcon from "@mui/icons-material/Warning";
import ErrorIcon from "@mui/icons-material/Error";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import EventIcon from "@mui/icons-material/Event";
import LightbulbIcon from "@mui/icons-material/Lightbulb";

// Définition des animations en dehors du composant pour de meilleures performances
const flicker = keyframes`
  0% { opacity: 1; transform: scale(1) rotate(0deg); }
  50% { opacity: 0.6; transform: scale(1.1) rotate(5deg); }
  100% { opacity: 1; transform: scale(1) rotate(-5deg); }
`;

const typeConfig = {
  info: {
    color: "#3399ff", // Nouvelle couleur pour le thème 'old'
    icon: <InfoIcon fontSize="2cm" />,
  },
  success: {
    color: "#4dff88",
    icon: <CheckCircleIcon fontSize="2cm" />,
  },
  warning: {
    color: "#ffaa33",
    icon: <WarningIcon fontSize="2cm" />,
  },
  error: {
    color: "#ff0033",
    icon: <ErrorIcon fontSize="2cm" />,
  },
  welcome: {
    color: "#33ff77",
    icon: <RocketLaunchIcon fontSize="2cm" />,
  },
  event: {
    color: "#cc33ff",
    icon: <EventIcon fontSize="2cm" />,
  },
  tips: {
    color: "#ffd700",
    icon: <LightbulbIcon fontSize="2cm" />,
  },
};

// Composant pour les runes animées
const AnimatedRunes = ({ type }) => {
  const color = typeConfig[type]?.color || typeConfig.info.color;
  const commonStyle = {
    position: "absolute",
    width: 30,
    height: 30,
    color: color,
    fontSize: 30,
    textShadow: "0 0 5px #000",
    animation: `${flicker} 2s infinite alternate`,
  };

  return (
    <>
      <Box sx={{ ...commonStyle, top: 10, left: "50%" }}>ᚠ</Box>
      <Box sx={{ ...commonStyle, bottom: 10, right: "40%" }}>ᚢ</Box>
      <Box sx={{ ...commonStyle, top: "50%", right: 10 }}>ᚦ</Box>
    </>
  );
};

const Transition = React.forwardRef(function Transition(props, ref) {
  return (
    <Slide direction="down" ref={ref} {...props} timeout={500}>
      <Fade in={props.in} timeout={600}>
        {props.children}
      </Fade>
    </Slide>
  );
});

export default function OldPopup({
  open,
  onClose,
  onConfirm,
  type = "info",
  title = "Titre du popup",
  message = "Message du popup",
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
      PaperProps={{
        sx: {
          position: "relative",
          background: "linear-gradient(145deg, #3b2e2e, #5c4438)",
          padding: "2.5rem 3rem",
          borderRadius: "20px",
          border: `6px double #7b5e57`,
          boxShadow:
            "inset 0 0 30px rgba(255,255,255,0.05), 0 0 30px rgba(0,0,0,0.6)",
          color: "#f5f1e0",
          fontFamily: "'MedievalSharp', cursive",
          overflow: "visible",
          minWidth: "80vw",
          maxWidth: "80vw",
        },
      }}
      sx={{
        "& .MuiDialog-container": {
          alignItems: "center",
          justifyContent: "center",
        },
      }}
    >
      <Box sx={{ position: "relative", zIndex: 1, textAlign: "left" }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Box
            sx={{
              mr: 3,
              fontSize: "100px",
              color,
              float: "left",
              textShadow: "0 0 10px #000, 2px 2px 0 #222",
            }}
          >
            {icon}
          </Box>
          <DialogTitle
            sx={{
              margin: 0,
              fontSize: "2.5rem",
              color,
              textShadow: "1px 1px 0 #000",
              fontFamily: "inherit",
              flexGrow: 1,
            }}
          >
            {title}
          </DialogTitle>
        </Box>
        <DialogContent sx={{ overflow: "visible", p: 0 }}>
          <Typography
            variant="body1"
            sx={{
              margin: "1rem 0",
              fontSize: "1.2rem",
              lineHeight: "1.6rem",
              textAlign: "left",
              fontFamily: "inherit",
              maxHeight: "calc(80vh - 10cm)",
              overflowY: "auto",
            }}
            component="div"
          >
            {message}
          </Typography>
        </DialogContent>
        <DialogActions
          sx={{ justifyContent: "flex-start", mt: 4, gap: "1rem", p: 0 }}
        >
          <Button
            onClick={onConfirm || onClose}
            sx={{
              background: "#5c4438",
              border: `2px solid ${color}`,
              color,
              padding: "0.8rem 1.6rem",
              borderRadius: "8px",
              fontSize: "1.1rem",
              fontFamily: "inherit",
              transition: "0.3s",
              textShadow: "1px 1px 0 #000",
              "&:hover": {
                background: color,
                color: "#3b2e2e",
                boxShadow: `0 0 15px ${color}`,
              },
            }}
          >
            OK
          </Button>
          {onConfirm && (
            <Button
              onClick={onClose}
              sx={{
                background: "#5c4438",
                border: "2px solid #ccc",
                color: "#ccc",
                padding: "0.8rem 1.6rem",
                borderRadius: "8px",
                fontSize: "1.1rem",
                fontFamily: "inherit",
                transition: "0.3s",
                textShadow: "1px 1px 0 #000",
                "&:hover": {
                  background: "#ccc",
                  color: "#3b2e2e",
                  boxShadow: `0 0 15px #ccc`,
                },
              }}
            >
              Annuler
            </Button>
          )}
        </DialogActions>
      </Box>
      <AnimatedRunes type={type} />
    </Dialog>
  );
}
