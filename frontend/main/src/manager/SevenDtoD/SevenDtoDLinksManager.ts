/**
 * @author Valkream Team
 * @license MIT-NC
 */

import { baseUrl } from "../../constants";
import { toValidUrl } from "../../utils";
import { platform } from "os";

class SevenDtoDLinksManager {
  async gameVersionUrl(): Promise<string> {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const SettingsManager = (
      require("../settingsManager") as typeof import("../settingsManager")
    ).default;
    const isBeta = await SettingsManager.getSetting("betaEnabled");
    return `${baseUrl}/games/SevenDtoD/latest/latest${
      isBeta ? ".beta" : ""
    }.yml`;
  }

  async gameZipLink(): Promise<string> {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const SevenDtoDVersionManager = (
      require("./SevenDtoDVersionManager") as typeof import("./SevenDtoDVersionManager")
    ).default;
    const config = await SevenDtoDVersionManager.getOnlineVersionConfig();
    const urls = config?.sevendtod?.download_url;

    if (!urls) throw new Error("Game download URLs not found in config");

    const url = (urls as Partial<Record<NodeJS.Platform, string>>)[platform()];
    if (!url)
      throw new Error(`No game download URL found for platform: ${platform()}`);

    return toValidUrl(url);
  }

  async modHashLink(): Promise<string> {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const SevenDtoDVersionManager = (
      require("./SevenDtoDVersionManager") as typeof import("./SevenDtoDVersionManager")
    ).default;
    const config = await SevenDtoDVersionManager.getOnlineVersionConfig();
    const url = config?.modpack?.hashs_url;

    if (!url) throw new Error("Mod Hash Url URL not found in config");

    return toValidUrl(url);
  }

  async modsFileBaseUrl(): Promise<string> {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const SevenDtoDVersionManager = (
      require("./SevenDtoDVersionManager") as typeof import("./SevenDtoDVersionManager")
    ).default;
    const config = await SevenDtoDVersionManager.getOnlineVersionConfig();
    const url = config?.modpack?.download_url;

    if (!url) throw new Error("Mod Hash Url URL not found in config");

    return toValidUrl(url);
  }
}

export default new SevenDtoDLinksManager();
