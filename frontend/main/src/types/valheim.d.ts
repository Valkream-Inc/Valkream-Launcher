/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Types internes au process main pour Valheim.
 * Les types partagés (ValheimVersionConfig, ValheimBaseMod...) viennent de `@shared/types`.
 */

/** Contenu du `manifest.json` Thunderstore du modpack. */
export interface ValheimThunderstoreManifest {
  /** Mods au format `Auteur-Nom-Version`. */
  dependencies?: string[];
  [key: string]: unknown;
}

/** Informations extraites d'un nom de mod `Auteur-Nom-Version`. */
export interface ValheimModInfos {
  url: string;
  author: string;
  name: string;
  version: string;
}

/** Options de `ValheimGameManager.restoreGameFolder`. */
export interface ValheimRestoreGameFolderOptions {
  /** Ne pas rappeler `init()` (déjà fait par l'appelant). */
  noInit?: boolean;
}

/** État d'un groupe de mods custom (admin, boostfps, boostgraphic). */
export interface ValheimCustomModsCheck {
  active: boolean;
  installed: boolean;
  available: boolean;
}

/** Type et version en ligne d'un mod, calculés par `getModsData`. */
export interface ValheimModTypeAndOnlineVersion {
  type: "admin" | "normal";
  onlineVersion: string | undefined;
}

/** Réponse de l'API Thunderstore `package/{auteur}/{nom}/{version}/`. */
export interface ThunderstorePackageVersionResponse {
  dependencies?: string[];
}

/** Réponse de l'API Thunderstore `package/{auteur}/{nom}/`. */
export interface ThunderstorePackageResponse {
  latest?: {
    version_number?: string;
    description?: string;
    icon?: string;
  };
}
