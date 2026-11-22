/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * GÉNÉRÉ par `yarn depot:pin` : DepotDownloader (SteamRE, GPL-2.0, https://github.com/SteamRE/DepotDownloader),
 * binaire officiel épinglé par version + sha256 (calculé sur le zip téléchargé).
 * Pour changer de version : `yarn depot:pin <tag>` puis publier le launcher. Au premier usage suivant,
 * la nouvelle version est téléchargée, vérifiée, et les anciennes supprimées.
 */

export interface DepotAsset {
  /** URL du zip de la release officielle. */
  url: string;
  /** sha256 du zip (hexadécimal). */
  sha256: string;
  /** Exécutable dans le zip. */
  file: string;
}

/** Clé : `<os.platform()>-<os.arch()>`, ex : `win32-x64`, `linux-x64`, `darwin-arm64`. */
export const DEPOT_DOWNLOADER_VERSION = "DepotDownloader_3.4.0";
export const DEPOT_DOWNLOADER_ASSETS: Record<string, DepotAsset> = {
  "darwin-arm64": {"url":"https://github.com/SteamRE/DepotDownloader/releases/download/DepotDownloader_3.4.0/DepotDownloader-macos-arm64.zip","sha256":"60e80c7c496f3f9a079cd3c62036b35d088c27bc0149baf38f009eb57a52f6a5","file":"DepotDownloader"},
  "darwin-x64": {"url":"https://github.com/SteamRE/DepotDownloader/releases/download/DepotDownloader_3.4.0/DepotDownloader-macos-x64.zip","sha256":"3214b689564d73e9342a8a4aef693de6ad3d293801b0f300a4466f60ec75befb","file":"DepotDownloader"},
  "linux-arm": {"url":"https://github.com/SteamRE/DepotDownloader/releases/download/DepotDownloader_3.4.0/DepotDownloader-linux-arm.zip","sha256":"6cd66cd4f4f1e99ca2b30ca5ce097545d93bdad1fa754d9a74d8738e9e4e1022","file":"DepotDownloader"},
  "linux-arm64": {"url":"https://github.com/SteamRE/DepotDownloader/releases/download/DepotDownloader_3.4.0/DepotDownloader-linux-arm64.zip","sha256":"d9fb612ccebc1db8eeea3b4045d2221ec70431381393ce908fb72f01d4f9c812","file":"DepotDownloader"},
  "linux-x64": {"url":"https://github.com/SteamRE/DepotDownloader/releases/download/DepotDownloader_3.4.0/DepotDownloader-linux-x64.zip","sha256":"a999dec66b4850fc961bd50366696d23c2d0fad7b18790e6a5647b2f19097a53","file":"DepotDownloader"},
  "win32-arm64": {"url":"https://github.com/SteamRE/DepotDownloader/releases/download/DepotDownloader_3.4.0/DepotDownloader-windows-arm64.zip","sha256":"1449ba47775e9974036e615bedf00d72bef747cc5b93a78048ed4e0b2c63b2b3","file":"DepotDownloader.exe"},
  "win32-x64": {"url":"https://github.com/SteamRE/DepotDownloader/releases/download/DepotDownloader_3.4.0/DepotDownloader-windows-x64.zip","sha256":"41c9e9f0df54b3ad02e67a11726756e5c73283bd7c2e1b04acfa5ae4c2ed3767","file":"DepotDownloader.exe"},
};
