const {
  GameManager,
  ThunderstoreManager,
  VersionManager,
} = require("../../manager");
const Reload = require("./reload.js");

class Update {
  async init(event, date) {
    const callback = (text, processedBytes, totalBytes, percent, speed) => {
      event.reply(`progress-${date}`, {
        text,
        processedBytes,
        totalBytes,
        percent,
        speed,
      });
    };

    const onlineVersionConfig = await VersionManager.getOnlineVersionConfig();
    const localVersionConfig = await VersionManager.getLocalVersionConfig();

    if (onlineVersionConfig?.modpack?.gameFolderToPreserve)
      await GameManager.preserveGameFolder(
        onlineVersionConfig?.modpack?.gameFolderToPreserve
      );

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
    }

    await ThunderstoreManager.update(callback);
    if (onlineVersionConfig?.modpack?.gameFolderToRemove)
      await GameManager.clean(onlineVersionConfig?.modpack?.gameFolderToRemove);

    await GameManager.restoreGameFolder();
    await VersionManager.updateLocalVersionConfig();
    await Reload.init();
  }
}

const update = new Update();
module.exports = update;
