/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Types de `build-script.ts` (aucun code exécutable ici).
 */

/** Type d'installeur produit : installation complète ou mise à jour silencieuse. */
export type BuildType = "install" | "update";

/** Options NSIS qui diffèrent entre l'installeur et la mise à jour. */
export interface BuildNsisOptions {
  oneClick: boolean;
  allowToChangeInstallationDirectory: boolean;
  /** Génération des .blockmap (utile uniquement pour la mise à jour). */
  differentialPackage: boolean;
}

export interface BuildTarget {
  type: BuildType;
  nsis: BuildNsisOptions;
}
