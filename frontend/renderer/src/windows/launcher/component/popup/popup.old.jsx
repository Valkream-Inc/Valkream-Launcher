/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

import React, { memo } from "react";
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
import { keyframes } from "@mui/system";

import { typeConfig } from "./component/popup.config";
import { createButtons } from "./component/popup.button";

// Définition des animations en dehors du composant pour de meilleures performances
const flicker = keyframes`
  0% { opacity: 1; transform: scale(1) rotate(0deg); }
  50% { opacity: 0.6; transform: scale(1.1) rotate(5deg); }
  100% { opacity: 1; transform: scale(1) rotate(-5deg); }
`;

function getOldTypeConfig(type) {
  const c = typeConfig[type] || typeConfig.info;
  return {
    color: c.color.old,
    icon: c.icon.old,
  };
}

// Composant pour les runes animées
const AnimatedRunes = ({ type }) => {
  const color = typeConfig[type]?.color?.old || typeConfig.info.color.old;
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

function OldPopup({
  open,
  onClose,
  onConfirm,
  type = "info",
  title = "Titre du popup",
  message = "Message du popup",
}) {
  const { color, icon } = getOldTypeConfig(type);
  const buttons = createButtons(onClose, onConfirm);

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
            className="old-theme"
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
          {buttons.map((button, index) => (
            <Button
              key={index}
              onClick={button.action}
              sx={{
                background: button.variant === "main" ? "#5c4438" : "#ccc",
                border:
                  button.variant === "main"
                    ? `2px solid ${color}`
                    : "2px solid #ccc",
                color: button.variant === "main" ? color : "#ccc",
                padding: "0.8rem 1.6rem",
                borderRadius: "8px",
                fontSize: "1.1rem",
                fontFamily: "inherit",
                transition: "0.3s",
                textShadow: "1px 1px 0 #000",
                "&:hover": {
                  background: button.variant === "main" ? color : "#ccc",
                  color: button.variant === "main" ? "#3b2e2e" : "#3b2e2e",
                  boxShadow:
                    button.variant === "main"
                      ? `0 0 15px ${color}`
                      : `0 0 15px #ccc`,
                },
              }}
            >
              {button.text}
            </Button>
          ))}
        </DialogActions>
      </Box>
      <AnimatedRunes type={type} />
    </Dialog>
  );
}

export default memo(OldPopup);
