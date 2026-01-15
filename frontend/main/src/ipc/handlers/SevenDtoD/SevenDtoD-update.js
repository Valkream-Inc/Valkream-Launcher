/**
 * @author Valkream Team
 * @license MIT-NC
 */

const { formatBytes } = require("../../../utils/function/formatBytes.js");

const SevenDtoDModsManager = require("../../../manager/SevenDtoD/SevenDtoDModsManager.js");
const SevenDtoDHashManager = require("../../../manager/SevenDtoD/SevenDtoDHashManager.js");

async function SevenDtoD_Update(event) {
  const callback = (text, processedBytes, totalBytes, percent, speed) => {
    event.sender.send("progress-update-SevenDtoD", {
      text,
      processedBytes: formatBytes(processedBytes),
      totalBytes: formatBytes(totalBytes),
      percent,
      speed: formatBytes(speed),
    });
  };

  try {
    await SevenDtoDModsManager.update(callback);
    await SevenDtoDHashManager.getLocalHash(true, callback);
    await event.sender.send("done-update-SevenDtoD");
    return { success: true };
  } catch (err) {
    console.error(err);
    event.sender.send("error-update-SevenDtoD", { message: err.message });
    throw err;
  }
}

module.exports = SevenDtoD_Update;
