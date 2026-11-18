/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Config render de chaque instance (ex-brouillon `render/config.js`).
 * Le main reste la source de vérité de la liste des instances (`getInstances()`) :
 * une entrée ici sans instance main correspondante n'est pas affichée.
 */

import type { InstanceRenderConfig } from "./instances.types";

const instancesRenderConfig: InstanceRenderConfig[] = [
  {
    id: "Valheim-Valkream-v2",
    name: "Valheim",
    icon: "./images/Valheim-name.png",
    // tipContent / descriptionContent : composants React à renseigner.
    customGamesSettings: [
      { type: "toggle", settingsName: "modsAdmin", label: "Mods admin" },
    ],
    debugContent: [
      { entry: "mods-thunderstore" },
      { entry: "mods-admin" },
      { entry: "configs" },
    ],
  },
];

export default instancesRenderConfig;
