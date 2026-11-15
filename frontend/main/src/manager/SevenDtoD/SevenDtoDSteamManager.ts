/**
 * @author Valkream Team
 * @license MIT-NC
 */

import { shell } from "electron";

class SevenDtoDSteamManager {
  async open() {
    try {
      await shell.openExternal("steam://store/251570");
    } catch (err) {
      console.error("Impossible d'ouvrir la page Steam :", err instanceof Error ? err.message : String(err));
    }
  }
}

export default new SevenDtoDSteamManager();
