/**
 * @author Valkream Team
 * @license MIT-NC
 */

/**
 * Retourne les styles de base (couleurs et typographie) pour le thème donné.
 */
const getModsThemeStyles = (currentTheme) => {
  switch (currentTheme) {
    case "old":
      return {
        mainBg: "#fbf0d8",
        textPrimary: "#5c4033",
        textSecondary: "#a08060",
        tableBg: "#e9d7ac",
        headerBg: "#c9b183",
        borderColor: "#a08060",
        fontFamily: "serif",
        boxShadow: "8px 8px 0px 0px #a08060",
      };
    case "modern":
      return {
        mainBg: "#1f2937",
        textPrimary: "#f3f4f6",
        textSecondary: "#9ca3af",
        tableBg: "#374151",
        headerBg: "#4b5563",
        borderColor: "#374151",
        fontFamily: "sans-serif",
        boxShadow: 8,
      };
    case "futuristic":
      return {
        mainBg: "#0c0a09",
        textPrimary: "#a78bfa",
        textSecondary: "#e60e0e",
        tableBg: "#1c0a2f",
        headerBg: "#370954",
        borderColor: "#f97316",
        fontFamily: "monospace",
        boxShadow: "0 0 15px rgba(167, 139, 250, 0.7)",
      };
    default:
      return getModsThemeStyles("modern");
  }
};

export default getModsThemeStyles;
