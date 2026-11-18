/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Config main de chaque instance (ex-brouillon `temp-for-new-system/main/config.js`).
 * Ajouter une instance = ajouter une entrée ici, une dans `renderer/src/instances`
 * et une dans l'index remote (`backend/public/index.config.json`).
 */

import type { InstanceMainConfig } from "../types/instances";

const instancesConfig: InstanceMainConfig[] = [
  {
    id: "Valheim-Valkream-v2",
    // Valeurs copiées de `constants/serversInfos.ts` : à adapter si la v2 a son propre serveur.
    server: {
      type: "valheim",
      host: "51.222.46.122",
      port: 2457,
      timeout: 2000,
    },
    indexUrl: "/index.config.json",
    gameUrl: "/games/Valheim-Valkream-v2/latest.yml",
    allowedPaths: ["game"],
    // Relatifs à la racine de l'installation (`instances/<id>/<canal>/`).
    executable: { win32: "game/valheim.exe", linux: "game/valheim.x86_64" },
    steamAppId: 892970,
  },
];

export default instancesConfig;
