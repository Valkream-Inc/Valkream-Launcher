/**
 * @author Valkream Team
 * @license MIT-NC
 */

import { baseUrl } from "../../constants";
import SettingsManager from "../settingsManager";
import { toValidUrl } from "../../utils";
import { platform } from "os";

class SevenDtoDLinksManager {
  async gameVersionUrl(): Promise<string> {
    const isBeta = await SettingsManager.getSetting("betaEnabled");
    return `${baseUrl}/games/SevenDtoD/latest/latest${
      isBeta ? ".beta" : ""
    }.yml`;
  }

  async gameZipLink(): Promise<string> {
    // Import différé : SevenDtoDVersionManager importe ce module (dépendance circulaire)
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const SevenDtoDVersionManager = require("./SevenDtoDVersionManager")
      .default as typeof import("./SevenDtoDVersionManager").default;
    const config = await SevenDtoDVersionManager.getOnlineVersionConfig();
    const urls = config?.sevendtod?.download_url;

    if (!urls) throw new Error("Game download URLs not found in config");

    const url = (urls as Partial<Record<NodeJS.Platform, string>>)[platform()];
    if (!url)
      throw new Error(`No game download URL found for platform: ${platform()}`);

    return toValidUrl(url);
  }

  async modHashLink(): Promise<string> {
    // Import différé : SevenDtoDVersionManager importe ce module (dépendance circulaire)
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const SevenDtoDVersionManager = require("./SevenDtoDVersionManager")
      .default as typeof import("./SevenDtoDVersionManager").default;
    const config = await SevenDtoDVersionManager.getOnlineVersionConfig();
    const url = config?.modpack?.hashs_url;

    if (!url) throw new Error("Mod Hash Url URL not found in config");

    return toValidUrl(url);
  }

  async modsFileBaseUrl(): Promise<string> {
    // Import différé : SevenDtoDVersionManager importe ce module (dépendance circulaire)
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const SevenDtoDVersionManager = require("./SevenDtoDVersionManager")
      .default as typeof import("./SevenDtoDVersionManager").default;
    const config = await SevenDtoDVersionManager.getOnlineVersionConfig();
    const url = config?.modpack?.download_url;

    if (!url) throw new Error("Mod Hash Url URL not found in config");

    return toValidUrl(url);
  }
}

export default new SevenDtoDLinksManager();
