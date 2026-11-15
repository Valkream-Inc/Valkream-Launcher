/**
 * @author Valkream Team
 * @license MIT-NC
 */

import { shell } from "electron";

class ValheimSteamManager {
  async start() {
    try {
      await shell.openExternal("steam://rungameid/892970");
    } catch (err) {
      console.error(
        "Impossible de lancer la mise à jour Steam :",
        err instanceof Error ? err.message : String(err)
      );
    }
  }

  async open() {
    try {
      await shell.openExternal("steam://store/892970");
    } catch (err) {
      console.error(
        "Impossible d'ouvrir la page Steam :",
        err instanceof Error ? err.message : String(err)
      );
    }
  }
}

export default new ValheimSteamManager();
