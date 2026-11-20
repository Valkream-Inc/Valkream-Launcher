/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Journal d'installation d'un canal (`instance.log`) : une ligne par évènement
 * (début, fin, erreur d'une entrée). Tronqué à la moitié quand il dépasse 512 Ko.
 * Le journal ne doit jamais faire échouer une installation.
 */

import fs from "fs";
import path from "path";

export const INSTALL_LOG_FILE = "instance.log";
const MAX_BYTES = 512 * 1024;

export const appendInstallLog = (installDir: string, message: string, now: Date = new Date()): void => {
  try {
    const file = path.join(installDir, INSTALL_LOG_FILE);
    fs.mkdirSync(installDir, { recursive: true });
    if (fs.existsSync(file) && fs.statSync(file).size > MAX_BYTES) {
      const kept = fs.readFileSync(file, "utf8").slice(-MAX_BYTES / 2);
      fs.writeFileSync(file, kept.slice(kept.indexOf("\n") + 1));
    }
    fs.appendFileSync(file, `${now.toISOString()} ${message.replace(/\s*\n\s*/g, " ")}\n`);
  } catch {
    // journal facultatif
  }
};
