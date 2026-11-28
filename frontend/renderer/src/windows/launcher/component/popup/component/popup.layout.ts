/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Mise en page commune des popups : un SEUL défilement (la zone de contenu), jamais la fenêtre entière,
 * barre fine, et réduction progressive des marges/tailles sur les petits écrans (hauteur).
 */

import type { SxProps, Theme } from "@mui/material";

/** Hauteur en dessous de laquelle les popups passent en mode compact. */
export const COMPACT = "@media (max-height: 720px)";
export const TINY = "@media (max-height: 560px)";

/** Paper : colonne flex bornée à l'écran, qui ne défile pas elle-même (sauf `overflow` du thème). */
export const paperLayout = {
  display: "flex",
  flexDirection: "column",
  boxSizing: "border-box",
  margin: "12px",
  width: "calc(100% - 24px)",
  maxHeight: "calc(100vh - 24px)",
  minHeight: 0,
} as const;

/** Conteneur interne (thèmes à décorations débordantes) : prend la hauteur du Paper et la laisse au contenu. */
export const innerLayout = {
  position: "relative",
  zIndex: 1,
  display: "flex",
  flexDirection: "column",
  flex: "1 1 auto",
  // Pas de maxHeight propre : il dépasserait la zone utile du Paper (marges + bordure) et ferait défiler la fenêtre
  // EN PLUS de la zone de contenu. La hauteur est bornée par le Paper (flex), seul le contenu défile.
  minHeight: 0,
} as const;

/** Zone de contenu : unique zone défilante, barre discrète. */
export const scrollArea: SxProps<Theme> = {
  flex: "1 1 auto",
  minHeight: 0,
  overflowY: "auto",
  overflowX: "hidden",
  overflowWrap: "anywhere",
  scrollbarWidth: "thin",
  scrollbarColor: "rgba(255,255,255,0.3) transparent",
  "&::-webkit-scrollbar": { width: 6 },
  "&::-webkit-scrollbar-thumb": { background: "rgba(255,255,255,0.3)", borderRadius: 3 },
  "&::-webkit-scrollbar-track": { background: "transparent" },
};

/** Barre de boutons : retour à la ligne plutôt que débordement. */
export const actionsLayout = {
  flexShrink: 0,
  flexWrap: "wrap",
  gap: 1,
} as const;

/** Bouton : le texte passe à la ligne au lieu de sortir du bouton. */
export const buttonText = {
  minWidth: 0,
  maxWidth: "100%",
  whiteSpace: "normal",
  overflowWrap: "anywhere",
  textAlign: "center",
  lineHeight: 1.25,
} as const;
