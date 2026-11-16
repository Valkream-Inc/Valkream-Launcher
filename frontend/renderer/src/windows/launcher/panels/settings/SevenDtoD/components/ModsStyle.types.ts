/**
 * @author Valkream Team
 * @license MIT-NC
 */

/** Styles de base (couleurs et typographie) d'un thème pour le tableau de mods. */
export interface ModsThemeStyles {
  mainBg: string;
  textPrimary: string;
  textSecondary: string;
  tableBg: string;
  headerBg: string;
  borderColor: string;
  fontFamily: string;
  /** Chaîne CSS ou index d'élévation MUI. */
  boxShadow: string | number;
}
