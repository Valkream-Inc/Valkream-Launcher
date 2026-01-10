/**
 * @author Valkream Team
 * @license MIT-NC
 */

const { formatBytes } = require("../../../utils/function/formatBytes.js");

const SevenDtoDModsManager = require("../../../manager/SevenDtoD/SevenDtoDModsManager.js");
const SevenDtoDSteamManager = require("../../../manager/SevenDtoD/SevenDtoDSteamManager.js");

async function SevenDtoD_Play(event) {
  const callback = (text, processedBytes, totalBytes, percent, speed) => {
    event.sender.send("progress-play-SevenDtoD", {
      text,
      processedBytes: formatBytes(processedBytes),
      totalBytes: formatBytes(totalBytes),
      percent,
      speed: formatBytes(speed),
    });
  };

  try {
    await SevenDtoDModsManager.play(callback);
    await SevenDtoDSteamManager.play();
    await event.sender.send("done-play-SevenDtoD");
    return { success: true };
  } catch (err) {
    console.error(err);
    event.sender.send("error-play-SevenDtoD", { message: err.message });
    throw err;
  }
}

module.exports = SevenDtoD_Play;
