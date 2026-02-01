/**
 * @author Valkream Team
 * @license MIT-NC
 */

const { formatBytes } = require("../../../utils/function/formatBytes.js");

const SevenDtoDGameManager = require("../../../manager/SevenDtoD/SevenDtoDGameManager.js");
const SevenDtoDModsManager = require("../../../manager/SevenDtoD/SevenDtoDModsManager.js");
const SevenDtoDHashManager = require("../../../manager/SevenDtoD/SevenDtoDHashManager.js");
const SevenDtoDVersionManager = require("../../../manager/SevenDtoD/SevenDtoDVersionManager.js");

async function SevenDtoD_Install(event) {
  const callback = (text, processedBytes, totalBytes, percent, speed) => {
    event.sender.send("progress-install-SevenDtoD", {
      text,
      processedBytes: formatBytes(processedBytes),
      totalBytes: formatBytes(totalBytes),
      percent,
      speed: formatBytes(speed),
    });
  };

  try {
    await SevenDtoDGameManager.dowloadGame(callback);
    await SevenDtoDGameManager.unzipGame(callback);
    await SevenDtoDGameManager.finishGame(callback);

    await SevenDtoDModsManager.install(callback);
    await SevenDtoDHashManager.getLocalHash(true, callback);
    await SevenDtoDVersionManager.updateLocalVersionConfig();
    await event.sender.send("done-install-SevenDtoD");
    return { success: true };
  } catch (err) {
    console.error(err);
    event.sender.send("error-install-SevenDtoD", { message: err.message });
    throw err;
  }
}

module.exports = SevenDtoD_Install;
