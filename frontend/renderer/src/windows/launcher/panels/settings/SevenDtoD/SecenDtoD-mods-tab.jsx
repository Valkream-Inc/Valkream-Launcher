import React, {
  forwardRef,
  useImperativeHandle,
  useState,
  useMemo,
} from "react";
// Importation des composants MUI pour le tableau
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Tooltip from "@mui/material/Tooltip";
import { keyframes } from "@mui/system"; // Nécessaire pour l'animation de chargement

// Importation des icônes demandées
import ArrowForwardIcon from "@mui/icons-material/ArrowForward"; // Bleu: Déplacé
import DeleteIcon from "@mui/icons-material/Delete"; // Rouge: Supprimé
import AddCircleIcon from "@mui/icons-material/AddCircle"; // Vert: Nouveau
import EditIcon from "@mui/icons-material/Edit"; // Orange: Modifié
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline"; // Gris: Inchangé

import { useTheme } from "../../../context/theme.context.jsx";

// --- Styles d'animation et de dépendances simulées ---

// Définition de l'animation de pulsation (simule 'animate-pulse')
const pulse = keyframes`
    0%, 100% { opacity: 1; }
    50% { opacity: .5; }
  `;

// Simulation des dépendances externes avec des styles MUI/SX
const Wait = ({ children, isLoading }) => (
  <Box sx={isLoading ? { animation: `${pulse} 1.5s infinite` } : {}}>
    {children}
  </Box>
);

/**
 * Retourne les styles de base (couleurs et typographie) pour le thème donné.
 * @param {string} currentTheme - Le nom du thème ('old', 'modern', 'futuristic').
 */
const getThemeStyles = (currentTheme) => {
  switch (currentTheme) {
    case "old": // Médiéval / Sépia
      return {
        mainBg: "#fbf0d8", // Crème/Pergame clair
        textPrimary: "#5c4033", // Brun foncé
        textSecondary: "#a08060", // Brun clair/Sépia
        tableBg: "#e9d7ac", // Papier texturé
        headerBg: "#c9b183", // Vieux bois/Bordure
        borderColor: "#a08060",
        fontFamily: "serif", // Style manuscrit/médiéval
        boxShadow: "8px 8px 0px 0px #a08060", // Ombre marquée
      };
    case "modern": // Dark Theme sobre
      return {
        mainBg: "#1f2937", // Gray-800
        textPrimary: "#f3f4f6", // Blanc cassé
        textSecondary: "#9ca3af", // Gray-400 (pour les hashs, etc.)
        tableBg: "#374151", // Gray-700
        headerBg: "#4b5563", // Gray-600
        borderColor: "#374151",
        fontFamily: "sans-serif", // Style moderne
        boxShadow: 8,
      };
    case "futuristic": // Cyberpunk (Accentuation néon et sombre profond)
      return {
        mainBg: "#0c0a09", // Stone-950 / Noir profond
        textPrimary: "#a78bfa", // Violet clair Néon
        textSecondary: "#4c0519", // Rouge foncé/Violet pour les textes secondaires
        tableBg: "#1c0a2f", // Violet-950 très sombre
        headerBg: "#370954", // Violet-900
        borderColor: "#f97316", // Orange vif Néon pour la bordure
        fontFamily: "monospace", // Style numérique/néon
        boxShadow: "0 0 15px rgba(167, 139, 250, 0.7)", // Ombre Néon Violet
      };
    default:
      return getThemeStyles("modern"); // Fallback
  }
};

// --- MAPPING DES STATUTS ET COULEURS D'ÉTAT ---

/**
 * Mappe l'état de synchronisation à l'icône et la couleur correspondantes.
 * Les couleurs des icônes restent vives pour tous les thèmes.
 * @returns {{Icon: React.Component, color: string, label: string, bgColor: string}}
 */
const getSyncStatusInfo = (status, theme) => {
  // Couleurs d'icônes standard (vives)
  const colors = {
    MOVED: {
      icon: "#60a5fa",
      primaryText:
        theme === "modern"
          ? "#93c5fd"
          : theme === "futuristic"
          ? "#38bdf8"
          : "#3b82f6",
      bg:
        theme === "futuristic"
          ? "#172554" // Bleu très sombre
          : theme === "old"
          ? "#f5ebe0"
          : "#172554",
      label: "Déplacé/Renommé",
    },
    DELETED: {
      icon: "#f87171",
      primaryText:
        theme === "modern"
          ? "#fca5a5"
          : theme === "futuristic"
          ? "#fb7171"
          : "#b91c1c",
      bg:
        theme === "futuristic"
          ? "#450a0a" // Rouge très sombre
          : theme === "old"
          ? "#fff7ed"
          : "#450a0a",
      label: "Supprimé (Local)",
    },
    MODIFIED: {
      icon: "#fb923c",
      primaryText:
        theme === "modern"
          ? "#fdba74"
          : theme === "futuristic"
          ? "#f97316"
          : "#9a3412",
      bg:
        theme === "futuristic"
          ? "#431407" // Orange très sombre
          : theme === "old"
          ? "#fdf2f8"
          : "#431407",
      label: "Modifié/Mis à jour",
    },
    NEW: {
      icon: "#4ade80",
      primaryText:
        theme === "modern"
          ? "#86efac"
          : theme === "futuristic"
          ? "#4ade80"
          : "#16a34a",
      bg:
        theme === "futuristic"
          ? "#064e3b" // Vert très sombre
          : theme === "old"
          ? "#f0fdf4"
          : "#064e3b",
      label: "Nouveau",
    },
    UNCHANGED: {
      icon: "#6b7280",
      primaryText:
        theme === "old"
          ? "#5c4033"
          : theme === "futuristic"
          ? "#a78bfa" // Texte principal futuriste
          : "#d1d5db",
      bg:
        theme === "old"
          ? "#e9d7ac"
          : theme === "futuristic"
          ? "#1c0a2f" // Fond de table futuriste
          : "#1f2937",
      label: "Inchangé",
    },
  };

  const statusInfo = colors[status] || colors.UNCHANGED;

  return {
    Icon:
      status === "MOVED"
        ? ArrowForwardIcon
        : status === "DELETED"
        ? DeleteIcon
        : status === "MODIFIED"
        ? EditIcon
        : status === "NEW"
        ? AddCircleIcon
        : CheckCircleOutlineIcon,
    color: statusInfo.icon,
    bgColor: statusInfo.bg,
    label: statusInfo.label,
    primaryColor: statusInfo.primaryText,
  };
};

// --- DONNÉES DE MOCK POUR LA DÉMO (Inchangées) ---
// --- DONNÉES DE MOCK POUR LA DÉMO (Liste Élargie) ---
const MOCK_MODS_DATA = [
  {
    status: "NEW",
    oldPath: null,
    newPath: "/data/new_config_v3.json",
    hash: "h003",
  },
  {
    status: "MOVED",
    oldPath: "/old/assets/texture_pack_01.zip",
    newPath: "/new/assets/texture_pack_01.zip",
    hash: "tex01",
  },
  {
    status: "MODIFIED",
    oldPath: "/scripts/main_game_logic.lua",
    newPath: "/scripts/main_game_logic.lua",
    hash: "logc_up",
  },
  {
    status: "UNCHANGED",
    oldPath: "/shaders/lighting.hlsl",
    newPath: "/shaders/lighting.hlsl",
    hash: "shdr1",
  },
  {
    status: "NEW",
    oldPath: null,
    newPath: "/maps/level_05_beta.dat",
    hash: "map5_new",
  },
  {
    status: "DELETED",
    oldPath: "/temp/debug_log.txt",
    newPath: null,
    hash: "dbgl_del",
  },
  {
    status: "MODIFIED",
    oldPath: "/interface/ui_skin_dark.dds",
    newPath: "/interface/ui_skin_dark.dds",
    hash: "ui_upd",
  },
  {
    status: "UNCHANGED",
    oldPath: "/readme.txt",
    newPath: "/readme.txt",
    hash: "read1",
  },
  {
    status: "MOVED",
    oldPath: "/fkdkf/dfldl/fichier2",
    newPath: "/new/path/fichier2",
    hash: "hash2",
  },
  {
    status: "MODIFIED",
    oldPath: "/document/important.pdf",
    newPath: "/document/important.pdf",
    hash: "hash_new",
  },
  {
    status: "DELETED",
    oldPath: "/archive/obsolete.zip",
    newPath: null,
    hash: "hash_del",
  },
  { status: "NEW", oldPath: null, newPath: "/new/file3.txt", hash: "hash3" },
  {
    status: "UNCHANGED",
    oldPath: "/tot/tatra/fichier.txt",
    newPath: "/tot/tatra/fichier.txt",
    hash: "hash1",
  },
  {
    status: "MODIFIED",
    oldPath: "/config/game.xml",
    newPath: "/config/game.xml",
    hash: "h001_new",
  },
  {
    status: "NEW",
    oldPath: null,
    newPath: "/assets/texture_v2.zip",
    hash: "h002",
  },
  {
    status: "UNCHANGED",
    oldPath: "/sound/ambience.ogg",
    newPath: "/sound/ambience.ogg",
    hash: "amb01",
  },
  {
    status: "DELETED",
    oldPath: "/old_patch_data/patch_01.dat",
    newPath: null,
    hash: "p01_del",
  },
  {
    status: "MOVED",
    oldPath: "/models/player_v1.mdl",
    newPath: "/models/player_v2.mdl",
    hash: "plmv2",
  },
];

// --- COMPOSANT PRINCIPAL ---

const SevenDtoD_ModsTab = forwardRef((props, ref) => {
  // Intégration du hook de thème
  const { theme } = useTheme();
  const themeStyles = getThemeStyles(theme);

  // États pour les résultats de synchronisation
  const [isLoading, setIsLoading] = useState(false); // État de chargement

  const fetchMods = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 1500);
  };

  useImperativeHandle(ref, () => ({
    reload: () => fetchMods(),
    freeze: () => {},
    stop: () => {},
  }));

  // Utilisation des données de mock pour la démo du tableau
  const modsToDisplay = useMemo(() => MOCK_MODS_DATA, []);

  // Adaptation du SettingsTitle pour utiliser le style dynamique
  const DynamicSettingsTitle = ({ children }) => (
    <Typography
      variant="h5"
      component="h2"
      sx={{
        fontWeight: "bold",
        mb: 2,
        color: themeStyles.textPrimary,
        fontFamily: themeStyles.fontFamily,
      }}
    >
      {children}
    </Typography>
  );

  return (
    <Box
      sx={{
        p: 3,
        bgcolor: themeStyles.mainBg,
        color: themeStyles.textPrimary, // Couleur de texte par défaut pour le Box
        borderRadius: 2,
        boxShadow: themeStyles.boxShadow,
        maxWidth: "90%",
        mx: "auto",
        my: 4,
        fontFamily: themeStyles.fontFamily,
      }}
    >
      <DynamicSettingsTitle>
        Statut de Synchronisation des Mods ({theme.toUpperCase()})
      </DynamicSettingsTitle>

      <Wait isLoading={isLoading}>
        {modsToDisplay.length === 0 ? (
          <Typography
            sx={{
              textAlign: "center",
              color: themeStyles.textSecondary,
              py: 5,
            }}
          >
            Aucune donnée de synchronisation disponible.
          </Typography>
        ) : (
          <TableContainer
            component={Paper}
            sx={{
              mt: 2,
              border: `1px solid ${themeStyles.borderColor}`,
              borderRadius: 1,
              bgcolor: themeStyles.tableBg,
              boxShadow: "none",
            }}
          >
            <Table size="small" aria-label="mods synchronization table">
              <TableHead sx={{ bgcolor: themeStyles.headerBg }}>
                <TableRow>
                  <TableCell
                    sx={{
                      fontWeight: "medium",
                      color: themeStyles.textPrimary,
                      width: "50px",
                      borderBottom: `1px solid ${themeStyles.borderColor}`,
                    }}
                  >
                    Statut
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: "medium",
                      color: themeStyles.textPrimary,
                      borderBottom: `1px solid ${themeStyles.borderColor}`,
                    }}
                  >
                    Chemin du Fichier Local (Ancien)
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: "medium",
                      color: themeStyles.textPrimary,
                      borderBottom: `1px solid ${themeStyles.borderColor}`,
                    }}
                  >
                    Chemin du Fichier Distant (Nouveau)
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: "medium",
                      color: themeStyles.textPrimary,
                      width: "80px",
                      borderBottom: `1px solid ${themeStyles.borderColor}`,
                    }}
                  >
                    Hash
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {modsToDisplay.map((mod, index) => {
                  const { Icon, color, label, bgColor, primaryColor } =
                    getSyncStatusInfo(mod.status, theme);

                  const oldPath = mod.oldPath || "N/A";
                  const newPath = mod.newPath || "N/A";

                  return (
                    <TableRow
                      key={index}
                      sx={{
                        bgcolor: bgColor,
                        "&:hover": {
                          // Assure un effet de survol visible sur le fond sombre/clair
                          bgcolor: `${color}40`,
                        },
                      }}
                    >
                      <TableCell sx={{ color: themeStyles.textPrimary }}>
                        <Tooltip title={label} placement="right">
                          <Icon sx={{ color: color, fontSize: 18 }} />
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{
                            textDecoration:
                              mod.status === "DELETED"
                                ? "line-through"
                                : "none",
                            // Couleur spécifique à l'état (primaire pour DELETED) ou couleur de thème (textSecondary)
                            color:
                              mod.status === "DELETED"
                                ? primaryColor
                                : themeStyles.textPrimary,
                          }}
                        >
                          {oldPath}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight:
                              mod.status === "NEW" ? "bold" : "regular",
                            // Couleur spécifique à l'état (primaire pour NEW) ou couleur de thème (textPrimary)
                            color:
                              mod.status === "NEW"
                                ? primaryColor
                                : themeStyles.textPrimary,
                          }}
                        >
                          {newPath}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography
                          sx={{
                            color: themeStyles.textSecondary,
                            fontFamily: "monospace",
                            fontSize: "0.75rem",
                          }}
                        >
                          {mod.hash ? mod.hash.substring(0, 7) + "..." : "N/A"}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Wait>
    </Box>
  );
});

export default SevenDtoD_ModsTab;
