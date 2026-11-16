/**
 * @author Valkream Team
 * @license MIT-NC
 */

// Centralise les icônes et la configuration des types de popup
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import EventIcon from "@mui/icons-material/Event";
import InfoIcon from "@mui/icons-material/Info";
import LightbulbIcon from "@mui/icons-material/Lightbulb";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import WarningIcon from "@mui/icons-material/Warning";

import type { PopupTypeConfigMap } from "../popup.types";

// Taille historique du thème "old" (valeur hors union MUI, conservée telle quelle)
const OLD_ICON_SIZE = "2cm" as "large";

// Config classique, chaque thème peut surcharger ses valeurs
export const typeConfig: PopupTypeConfigMap = {
  info: {
    color: {
      old: "#3399ff",
      modern: "#4da6ff",
      futuristic: "#33aaff",
    },
    icon: {
      old: <InfoIcon fontSize={OLD_ICON_SIZE} />,
      modern: <InfoIcon fontSize="large" />,
      futuristic: <InfoIcon fontSize="inherit" />,
    },
    iconSize: { futuristic: 60 },
    titleSize: { futuristic: "2rem" },
    textSize: { futuristic: "1.2rem" },
  },
  success: {
    color: {
      old: "#4dff88",
      modern: "#4dff88",
      futuristic: "#4dff88",
    },
    icon: {
      old: <CheckCircleIcon fontSize={OLD_ICON_SIZE} />,
      modern: <CheckCircleIcon fontSize="large" />,
      futuristic: <CheckCircleIcon fontSize="inherit" />,
    },
    iconSize: { futuristic: 80 },
    titleSize: { futuristic: "2.2rem" },
    textSize: { futuristic: "1.2rem" },
  },
  warning: {
    color: {
      old: "#ffaa33",
      modern: "#ffbb33",
      futuristic: "#ffbb33",
    },
    icon: {
      old: <WarningIcon fontSize={OLD_ICON_SIZE} />,
      modern: <WarningIcon fontSize="large" />,
      futuristic: <WarningIcon fontSize="inherit" />,
    },
    iconSize: { futuristic: 65 },
    titleSize: { futuristic: "2.2rem" },
    textSize: { futuristic: "1.2rem" },
  },
  error: {
    color: {
      old: "#ff0033",
      modern: "#ff4d4d",
      futuristic: "#ff4d4d",
    },
    icon: {
      old: <ErrorIcon fontSize={OLD_ICON_SIZE} />,
      modern: <ErrorIcon fontSize="large" />,
      futuristic: <ErrorIcon fontSize="inherit" />,
    },
    iconSize: { futuristic: 60 },
    titleSize: { futuristic: "2rem" },
    textSize: { futuristic: "1.2rem" },
  },
  event: {
    color: {
      old: "#cc33ff",
      modern: "#b366ff",
      futuristic: "#ff33cc",
    },
    icon: {
      old: <EventIcon fontSize={OLD_ICON_SIZE} />,
      modern: <EventIcon fontSize="large" />,
      futuristic: <EventIcon fontSize="inherit" />,
    },
    iconSize: { futuristic: 70 },
    titleSize: { futuristic: "2.5rem" },
    textSize: { futuristic: "1.3rem" },
  },
  tips: {
    color: {
      old: "#ffd700",
      modern: "#ffdd33",
      futuristic: "#ffaa33",
    },
    icon: {
      old: <LightbulbIcon fontSize={OLD_ICON_SIZE} />,
      modern: <LightbulbIcon fontSize="large" />,
      futuristic: <LightbulbIcon fontSize="inherit" />,
    },
    iconSize: { futuristic: 65 },
    titleSize: { futuristic: "2rem" },
    textSize: { futuristic: "1.2rem" },
  },
  welcome: {
    color: {
      old: "#33ff77",
      modern: "#66ffcc",
      futuristic: "#00eaff",
    },
    icon: {
      old: <RocketLaunchIcon fontSize={OLD_ICON_SIZE} />,
      modern: <RocketLaunchIcon fontSize="large" />,
      futuristic: <RocketLaunchIcon fontSize="inherit" />,
    },
    iconSize: { futuristic: 80 },
    titleSize: { futuristic: "2.2rem" },
    textSize: { futuristic: "1.2rem" },
  },
};
