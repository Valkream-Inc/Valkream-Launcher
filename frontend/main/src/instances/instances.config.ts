/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Config main de chaque instance (ex-brouillon `temp-for-new-system/main/config.js`).
 * Ajouter une instance = ajouter une entrée ici, une dans `renderer/src/instances`
 * et un dossier `backend/public/games/<id>/` avec son `index.config.json`.
 */

import type { InstanceMainConfig } from "./instances.types";

/** Réglages par défaut d'une instance (le joueur peut les changer dans Réglages > Game). */
const DEFAULT_SETTINGS = { launchSteam: true, launcherBehavior: "close" } as const;

const instancesConfig: InstanceMainConfig[] = [
  {
    id: "Valheim-Valkream-v2",
    server: {
      type: "valheim",
      host: "51.222.46.122",
      port: 2457,
      timeout: 2000,
    },
    indexUrl: "/games/Valheim-Valkream-v2/index.config.json",
    // Où chaque entrée du latest.yml s'installe (relatif à la racine de l'installation).
    entryPaths: {
      valheim: "game",
      bepinex: "game",
      "mods-thunderstore": "game/BepInEx/plugins",
      "mods-admin": "game/BepInEx/plugins",
      "mods-boostfps": "game/BepInEx/plugins",
      "mods-boostgraphic": "game/BepInEx/plugins",
      configs: "game/BepInEx/config",
    },
    // Relatifs à la racine de l'installation (`instances/<id>/<canal>/`).
    executable: { win32: "game/valheim.exe", linux: "game/valheim.x86_64" },
    steamAppId: 892970,
    defaultSettings: DEFAULT_SETTINGS,
  },
  {
    id: "SevenDtoD-Valkream-v2",
    server: {
      type: "sdtd",
      host: "7days.valkream.com",
      port: 26900,
      timeout: 2000,
    },
    indexUrl: "/games/SevenDtoD-Valkream-v2/index.config.json",
    entryPaths: {
      sevendtod: "game",
      modpack: "game/Mods",
    },
    executable: { win32: "game/7DaysToDie.exe" },
    steamAppId: 251570,
    defaultSettings: DEFAULT_SETTINGS,
  },
];

export default instancesConfig;
