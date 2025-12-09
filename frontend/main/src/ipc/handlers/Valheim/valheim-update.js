/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

const { formatBytes } = require("../../../utils/function/formatBytes");

const ValheimGameManager = require("../../../manager/Valheim/ValheimGameManager");
const ValheimThunderstoreManager = require("../../../manager/Valheim/ValheimThunderstoreManager");
const ValheimVersionManager = require("../../../manager/Valheim/ValheimVersionManager");

async function ValheimUpdate(event) {
  const callback = (text, processedBytes, totalBytes, percent, speed) => {
    event.sender.send("progress-update-valheim", {
      text,
      processedBytes: formatBytes(processedBytes),
      totalBytes: formatBytes(totalBytes),
      percent,
      speed: formatBytes(speed),
    });
  };

  try {
    const onlineVersionConfig =
      await ValheimVersionManager.getOnlineVersionConfig();
    const localVersionConfig =
      await ValheimVersionManager.getLocalVersionConfig();

    const admin_mods = localVersionConfig?.modpack?.admin_mods;
    const boostfps_mods = localVersionConfig?.modpack?.boostfps_mods;

    if (
      onlineVersionConfig?.modpack?.gameFolderToPreserve ||
      admin_mods ||
      boostfps_mods
    ) {
      const gameFolderToPreserve = [
        ...onlineVersionConfig?.modpack?.gameFolderToPreserve,
        ...admin_mods.map((mod) => `/BepInEx/plugins/${mod}/`),
        ...boostfps_mods.map((mod) => `/BepInEx/plugins/${mod}/`),
      ];

      await ValheimGameManager.preserveGameFolder(gameFolderToPreserve);
    }

    if (
      !localVersionConfig?.modpack?.version ||
      !onlineVersionConfig?.modpack?.version ||
      localVersionConfig?.modpack?.version !==
        onlineVersionConfig?.modpack?.version
    ) {
      // si la version du modpack thunderstore est différente de la version locale
      await ValheimThunderstoreManager.uninstallModpackConfig();
      await ValheimThunderstoreManager.downloadModpack(callback);
      await ValheimThunderstoreManager.unzipModpack(callback);
      await ValheimThunderstoreManager.finishModpack();
    }

    await ValheimThunderstoreManager.update(callback);
    if (onlineVersionConfig?.modpack?.gameFolderToRemove)
      await ValheimGameManager.clean(
        onlineVersionConfig?.modpack?.gameFolderToRemove
      );

    await ValheimGameManager.restoreGameFolder();
    await ValheimVersionManager.updateLocalVersionConfig();

    event.sender.send("done-update-valheim");
    return { success: true };
  } catch (err) {
    console.error(err);
    event.sender.send("error-update-valheim", { message: err.message });
    throw err;
  }
}

module.exports = ValheimUpdate;
