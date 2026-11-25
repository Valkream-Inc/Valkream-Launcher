/**
 * @author Valkream Team
 * @license MIT-NC
 */

import React from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Slide,
  Typography,
} from "@mui/material";
import type { CSSProperties } from "react";
import { keyframes } from "@mui/system";

import { typeConfig } from "./component/popup.config";
import { createButtons } from "./component/popup.button";
import { COMPACT, TINY, actionsLayout, buttonText, innerLayout, paperLayout, scrollArea } from "./component/popup.layout";
import type {
  AnimatedRunesProps,
  PopupProps,
  PopupTransitionProps,
  PopupType,
} from "./popup.types";

// Définition des animations en dehors du composant pour de meilleures performances
const flicker = keyframes`
  0% { opacity: 1; transform: scale(1) rotate(0deg); }
  50% { opacity: 0.6; transform: scale(1.1) rotate(5deg); }
  100% { opacity: 1; transform: scale(1) rotate(-5deg); }
`;

function getOldTypeConfig(type: PopupType) {
  const c = typeConfig[type] || typeConfig.info;
  return {
    color: c.color.old,
    icon: c.icon.old,
  };
}

// Composant pour les runes animées
const AnimatedRunes = ({ type }: AnimatedRunesProps) => {
  const color = typeConfig[type]?.color?.old || typeConfig.info.color.old;
  const commonStyle: CSSProperties = {
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

// Transition Slide
const Transition = React.forwardRef<unknown, PopupTransitionProps>(
  function Transition(props, ref) {
    return <Slide direction="down" ref={ref} timeout={500} {...props} />;
  }
);

function OldPopup({
  open,
  onClose,
  onConfirm,
  buttons: customButtons,
  dismissible = true,
  type = "info",
  title = "Titre du popup",
  message = "Message du popup",
}: PopupProps) {
  const { color, icon } = getOldTypeConfig(type);
  const buttons = customButtons ?? createButtons(onClose, onConfirm);

  return (
    <Dialog
      open={open}
      onClose={dismissible ? onClose : undefined}
      slots={{ transition: Transition }}
      keepMounted
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            ...paperLayout,
            position: "relative",
            background: "linear-gradient(145deg, #3b2e2e, #5c4438)",
            padding: "2.5rem 3rem",
            [COMPACT]: { padding: "1.2rem 1.6rem", borderWidth: "4px" },
            [TINY]: { padding: "0.8rem 1.2rem" },
            borderRadius: "20px",
            border: `6px double #7b5e57`,
            boxShadow:
              "inset 0 0 30px rgba(255,255,255,0.05), 0 0 30px rgba(0,0,0,0.6)",
            color: "#f5f1e0",
            fontFamily: "'MedievalSharp', cursive",
            overflow: "visible",
            minWidth: "min(80vw, 900px)",
            maxWidth: "min(80vw, 900px)",
            //Transition Fade
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
      <Box sx={{ ...innerLayout, textAlign: "left" }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            mb: 2,
            flexShrink: 0,
            [COMPACT]: { mb: 0.5 },
          }}
        >
          <Box
            sx={{
              mr: 3,
              fontSize: "100px",
              [COMPACT]: { fontSize: "44px", mr: 1.5, "& svg": { fontSize: "44px" } },
              [TINY]: { display: "none" },
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
              [COMPACT]: { fontSize: "1.5rem", p: 0 },
              color,
              textShadow: "1px 1px 0 #000",
              fontFamily: "inherit",
              flexGrow: 1,
            }}
          >
            {title}
          </DialogTitle>
        </Box>
        <DialogContent sx={{ ...scrollArea, p: 0, pr: 1 }}>
          <Typography
            variant="body1"
            className="old-theme"
            sx={{
              margin: "1rem 0",
              fontSize: "1.2rem",
              lineHeight: "1.6rem",
              textAlign: "left",
              fontFamily: "inherit",
              [COMPACT]: { margin: "0.4rem 0", fontSize: "1rem", lineHeight: "1.3rem" },
            }}
            component="div"
          >
            {message}
          </Typography>
        </DialogContent>
        <DialogActions
          sx={{ justifyContent: "flex-start", ...actionsLayout, mt: 4, gap: "1rem", p: 0, [COMPACT]: { mt: 1.5, gap: "0.5rem" } }}
        >
          {buttons.map((button, index) => (
            <Button
              key={index}
              onClick={button.action}
            disabled={button.disabled}
              sx={{
                background: button.variant === "main" ? "#5c4438" : "#ccc",
                border:
                  button.variant === "main"
                    ? `2px solid ${color}`
                    : "2px solid black",
                color: button.variant === "main" ? color : "black",
                ...buttonText,
                padding: "0.8rem 1.6rem",
                borderRadius: "8px",
                fontSize: "1.1rem",
                [COMPACT]: { padding: "0.4rem 1rem", fontSize: "0.9rem" },
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

export default OldPopup;
