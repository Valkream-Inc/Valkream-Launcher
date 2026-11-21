/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * DepotDownloader (SteamRE, GPL-2.0, https://github.com/SteamRE/DepotDownloader) : binaire OFFICIEL
 * épinglé par version + sha256. Le launcher refuse de l'exécuter si le hash ne correspond pas.
 *
 * À REMPLIR par un administrateur (non fournis ici : les valeurs ne peuvent pas être inventées) :
 * 1. choisir une release sur la page « Releases » du dépôt SteamRE/DepotDownloader ;
 * 2. pour chaque plateforme, copier l'URL du zip et son sha256 (`sha256sum` / `Get-FileHash`) ;
 * 3. `file` = chemin de l'exécutable dans le zip.
 * Tant qu'une plateforme n'a pas d'entrée, DepotDownloader n'est pas proposé sur celle-ci.
 */

export interface DepotAsset {
  /** URL du zip de la release officielle. */
  url: string;
  /** sha256 du zip (hexadécimal). */
  sha256: string;
  /** Exécutable dans le zip (ex : `DepotDownloader.exe`). */
  file: string;
}

/** Clé : `<os.platform()>-<os.arch()>`, ex : `win32-x64`, `linux-x64`, `darwin-arm64`. */
export const DEPOT_DOWNLOADER_VERSION = "";
export const DEPOT_DOWNLOADER_ASSETS: Record<string, DepotAsset> = {
  // "win32-x64": { url: "https://github.com/SteamRE/DepotDownloader/releases/download/…/DepotDownloader-windows-x64.zip", sha256: "…", file: "DepotDownloader.exe" },
};
