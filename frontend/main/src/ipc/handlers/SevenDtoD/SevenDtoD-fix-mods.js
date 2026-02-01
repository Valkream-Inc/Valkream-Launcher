/**
 * @author Valkream Team
 * @license MIT-NC
 */
const SevenDtoDModsManager = require("../../../manager/SevenDtoD/SevenDtoDModsManager.js");

async function SevenDtoD_FixMods(event) {
  const callback = (text, processedBytes, totalBytes, percent, speed) => {
    event.sender.send("progress-fix-mods-SevenDtoD", {
      text,
    });
  };

  try {
    await SevenDtoDModsManager.generateFix(callback);
    await event.sender.send("done-fix-mods-SevenDtoD");
    return { success: true };
  } catch (err) {
    console.error(err);
    event.sender.send("error-fix-mods-SevenDtoD", { message: err.message });
    throw err;
  }
}

module.exports = SevenDtoD_FixMods;
