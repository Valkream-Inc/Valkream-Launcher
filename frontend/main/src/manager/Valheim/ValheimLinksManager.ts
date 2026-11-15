/**
 * @author Valkream Team
 * @license MIT-NC
 */

import { baseUrl } from "../../constants";
import { toValidUrl } from "../../utils";
import { platform } from "os";

class ValheimLinksManager {
  async gameVersionUrl() {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const SettingsManager = (require("../settingsManager") as typeof import("../settingsManager")).default;
    const isBeta = await SettingsManager.getSetting("betaEnabled");
    return `${baseUrl}/games/Valheim/latest/latest${isBeta ? ".beta" : ""}.yml`;
  }

  async gameZipLink() {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ValheimVersionManager = (require("./ValheimVersionManager") as typeof import("./ValheimVersionManager")).default;
    const config = await ValheimVersionManager.getOnlineVersionConfig();
    const urls = config?.valheim?.download_url;

    if (!urls) throw new Error("Game download URLs not found in config");

    const url = urls[platform()];
    if (!url)
      throw new Error(`No game download URL found for platform: ${platform()}`);

    return toValidUrl(url);
  }

  async bepInExZipLink() {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ValheimVersionManager = (require("./ValheimVersionManager") as typeof import("./ValheimVersionManager")).default;
    const config = await ValheimVersionManager.getOnlineVersionConfig();
    const urls = config?.bepinex?.download_url;

    if (!urls) throw new Error("BepInEx download URLs not found in config");

    const url = urls[platform()];
    if (!url)
      throw new Error(
        `No BepInEx download URL found for platform: ${platform()}`
      );

    return toValidUrl(url);
  }

  async modpackZipLink() {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ValheimVersionManager = (require("./ValheimVersionManager") as typeof import("./ValheimVersionManager")).default;
    const config = await ValheimVersionManager.getOnlineVersionConfig();
    const url = config?.modpack?.download_url;

    if (!url) throw new Error("Modpack download URL not found in config");

    return toValidUrl(url);
  }
}

export default new ValheimLinksManager();
