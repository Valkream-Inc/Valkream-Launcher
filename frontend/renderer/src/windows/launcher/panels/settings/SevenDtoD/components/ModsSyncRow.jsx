/**
 * @author Valkream Team
 * @license MIT-NC
 */

import React from "react";
import TableCell from "@mui/material/TableCell";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import Tooltip from "@mui/material/Tooltip";

// Importations des icônes (inchangées)
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import DeleteIcon from "@mui/icons-material/Delete";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import EditIcon from "@mui/icons-material/Edit";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";

/**
 * Mappe l'état de synchronisation à l'icône et la couleur correspondantes. (Inchangé)
 */
const getSyncStatusInfo = (status, theme) => {
  const colors = {
    MOVED: {
      Icon: ArrowForwardIcon,
      icon: "#60a5fa",
      primaryText:
        theme === "modern"
          ? "#93c5fd"
          : theme === "futuristic"
          ? "#38bdf8"
          : "#3b82f6",
      bg:
        theme === "futuristic"
          ? "#172554"
          : theme === "old"
          ? "#f5ebe0"
          : "#172554",
      label: "Déplacé/Renommé",
    },
    DELETED: {
      Icon: DeleteIcon,
      icon: "#f87171",
      primaryText:
        theme === "modern"
          ? "#fca5a5"
          : theme === "futuristic"
          ? "#fb7171"
          : "#b91c1c",
      bg:
        theme === "futuristic"
          ? "#450a0a"
          : theme === "old"
          ? "#fff7ed"
          : "#450a0a",
      label: "Supprimé (Local)",
    },
    MODIFIED: {
      Icon: EditIcon,
      icon: "#fb923c",
      primaryText:
        theme === "modern"
          ? "#fdba74"
          : theme === "futuristic"
          ? "#f97316"
          : "#9a3412",
      bg:
        theme === "futuristic"
          ? "#431407"
          : theme === "old"
          ? "#fdf2f8"
          : "#431407",
      label: "Modifié/Mis à jour",
    },
    NEW: {
      Icon: AddCircleIcon,
      icon: "#4ade80",
      primaryText:
        theme === "modern"
          ? "#86efac"
          : theme === "futuristic"
          ? "#4ade80"
          : "#16a34a",
      bg:
        theme === "futuristic"
          ? "#064e3b"
          : theme === "old"
          ? "#f0fdf4"
          : "#064e3b",
      label: "Nouveau",
    },
    UNCHANGED: {
      Icon: CheckCircleOutlineIcon,
      icon: "#6b7280",
      primaryText:
        theme === "old"
          ? "#5c4033"
          : theme === "futuristic"
          ? "#a78bfa"
          : "#d1d5db",
      bg:
        theme === "old"
          ? "#e9d7ac"
          : theme === "futuristic"
          ? "#1c0a2f"
          : "#1f2937",
      label: "Inchangé",
    },
  };

  const statusInfo = colors[status] || colors.UNCHANGED;
  return statusInfo;
};

// Fonction utilitaire pour tronquer le hash
const formatHash = (hash) => {
  if (!hash) return "N/A";
  return hash.length > 7 ? hash.substring(0, 7) + "..." : hash;
};

// Styles pour les hashes
const hashTextStyle = (themeStyles, isDifferent) => ({
  color: isDifferent ? themeStyles.textPrimary : themeStyles.textSecondary,
  fontWeight: isDifferent ? "bold" : "normal",
  fontFamily: "monospace",
  fontSize: "0.75rem",
});

const ModsSyncRow = ({ mod, theme, themeStyles }) => {
  const { Icon, icon, label, bg, primaryText } = getSyncStatusInfo(
    mod.status,
    theme
  );

  const oldPath = mod.oldPath || "N/A";
  const newPath = mod.newPath || "N/A";

  const hashLocalDisplay = formatHash(mod.hashLocal);
  const hashOnlineDisplay = formatHash(mod.hashOnline);

  return (
    <TableRow
      sx={{
        bgcolor: bg,
        "&:hover": {
          bgcolor: `${icon}40`,
        },
      }}
    >
      <TableCell sx={{ color: themeStyles.textPrimary }}>
        <Tooltip title={label} placement="right">
          <Icon sx={{ color: icon, fontSize: 18 }} />
        </Tooltip>
      </TableCell>
      <TableCell>
        <Typography
          variant="body2"
          sx={{
            textDecoration: mod.status === "DELETED" ? "line-through" : "none",
            color:
              mod.status === "DELETED" ? primaryText : themeStyles.textPrimary,
          }}
        >
          {oldPath}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography
          variant="body2"
          sx={{
            fontWeight: mod.status === "NEW" ? "bold" : "regular",
            color: mod.status === "NEW" ? primaryText : themeStyles.textPrimary,
          }}
        >
          {newPath}
        </Typography>
      </TableCell>

      <TableCell>
        <Tooltip title={mod.hashLocal || "N/A"} placement="top">
          <Typography
            sx={hashTextStyle(
              themeStyles,
              mod.status === "MODIFIED" || mod.status === "DELETED"
            )}
          >
            {hashLocalDisplay}
          </Typography>
        </Tooltip>
      </TableCell>

      <TableCell>
        <Tooltip title={mod.hashOnline || "N/A"} placement="top">
          <Typography
            sx={hashTextStyle(
              themeStyles,
              mod.status === "MODIFIED" || mod.status === "NEW"
            )}
          >
            {hashOnlineDisplay}
          </Typography>
        </Tooltip>
      </TableCell>
    </TableRow>
  );
};

export default ModsSyncRow;
