const GameManager = require("../../manager/gameManager.js");
const ThunderstoreManager = require("../../manager/thunderstoreManager.js");
const VersionManager = require("../../manager/versionManager.js");

const { formatBytes } = require("../../utils/function/formatBytes");

class Update {
  async init(event) {
    const callback = (text, processedBytes, totalBytes, percent, speed) => {
      event.sender.send("progress-update", {
        text,
        processedBytes: formatBytes(processedBytes),
        totalBytes: formatBytes(totalBytes),
        percent,
        speed: formatBytes(speed),
      });
    };

    try {
      const onlineVersionConfig = await VersionManager.getOnlineVersionConfig();
      const localVersionConfig = await VersionManager.getLocalVersionConfig();

      const admin_mods = localVersionConfig?.modpack?.admin_mods;
      const boostfps_mods = localVersionConfig?.modpack?.boostfps_mods;

      if (
        onlineVersionConfig?.modpack?.gameFolderToPreserve ||
        admin_mods ||
        boostfps_mods
      ) {
        this.gameFolderToPreserve = [
          ...onlineVersionConfig?.modpack?.gameFolderToPreserve,
          ...admin_mods.map((mod) => `/BepInEx/plugins/${mod}/`),
          ...boostfps_mods.map((mod) => `/BepInEx/plugins/${mod}/`),
        ];

        await GameManager.preserveGameFolder(this.gameFolderToPreserve);
      }

      if (
        !localVersionConfig?.modpack?.version ||
        !onlineVersionConfig?.modpack?.version ||
        localVersionConfig?.modpack?.version !==
          onlineVersionConfig?.modpack?.version
      ) {
        // si la version du modpack thunderstore est différente de la version locale
        await ThunderstoreManager.uninstallModpackConfig();
        await ThunderstoreManager.downloadModpack(callback);
        await ThunderstoreManager.unzipModpack(callback);
        await ThunderstoreManager.finishModpack();
      }

      await ThunderstoreManager.update(callback);
      if (onlineVersionConfig?.modpack?.gameFolderToRemove)
        await GameManager.clean(
          onlineVersionConfig?.modpack?.gameFolderToRemove
        );

      await GameManager.restoreGameFolder();
      await VersionManager.updateLocalVersionConfig();

      event.sender.send("done-update");
      return { success: true };
    } catch (err) {
      console.error(err);
      event.sender.send("error-update", { message: err.message });
      throw err;
    }
  }
}

const update = new Update();
module.exports = update;
