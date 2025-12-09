/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

const { formatBytes } = require("../../../utils/function/formatBytes.js");

const ValheimVersionManager = require("../../../manager/Valheim/ValheimVersionManager");
const ValheimThunderstoreManager = require("../../../manager/Valheim/ValheimThunderstoreManager");
const ValheimGameManager = require("../../../manager/Valheim/ValheimGameManager");

async function ValheimInstall(event) {
  const callback = (text, processedBytes, totalBytes, percent, speed) => {
    event.sender.send("progress-install-valheim", {
      text,
      processedBytes: formatBytes(processedBytes),
      totalBytes: formatBytes(totalBytes),
      percent,
      speed: formatBytes(speed),
    });
  };

  try {
    await ValheimGameManager.uninstall();

    await ValheimGameManager.dowloadGame(callback);
    await ValheimGameManager.unzipGame(callback);
    await ValheimGameManager.finishGame();

    await ValheimGameManager.dowloadBepInEx(callback);
    await ValheimGameManager.unzipBepInEx(callback);
    await ValheimGameManager.finishBepInEx();

    await ValheimThunderstoreManager.downloadModpack(callback);
    await ValheimThunderstoreManager.unzipModpack(callback);
    await ValheimThunderstoreManager.finishModpack();

    await ValheimThunderstoreManager.dowloadMods(callback);
    await ValheimThunderstoreManager.unzipMods(callback);
    await ValheimThunderstoreManager.finishMods();

    await ValheimVersionManager.updateLocalVersionConfig();

    event.sender.send("done-install-valheim");
    return { success: true };
  } catch (err) {
    console.error(err);
    event.sender.send("error-install-valheim", { message: err.message });
    throw err;
  }
}

module.exports = ValheimInstall;
