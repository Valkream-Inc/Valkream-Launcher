const path = require("path");
const fs = require("fs");

class Paths {
  srcDir = path.join(__dirname, "../");
  uploadDir = path.join(this.srcDir, "../uploads");
  tempDir = path.join(this.srcDir, "../temp");

  configUploadDir = path.join(this.uploadDir, "config");
  configValheimDir = path.join(this.configUploadDir, "Valheim");
  configSevenDtoDDir = path.join(this.configUploadDir, "SevenDtoD");

  launcherUploadDir = path.join(this.uploadDir, "launcher");
  launcherLatestDir = path.join(this.launcherUploadDir, "latest");
  launcherOldDir = path.join(this.launcherUploadDir, "old");
  launcherTempDir = path.join(this.tempDir, "launcher");

  gameUploadDir = path.join(this.uploadDir, "game/Valheim");
  gameLatestDir = path.join(this.gameUploadDir, "latest");
  gameOldDir = path.join(this.gameUploadDir, "old");
  gameTempDir = path.join(this.tempDir, "game");

  init() {
    const dirs = [
      this.uploadDir,

      this.configUploadDir,

      this.launcherUploadDir,
      this.launcherLatestDir,
      this.launcherOldDir,
      this.launcherTempDir,

      this.gameUploadDir,
      this.gameLatestDir,
      this.gameOldDir,
      this.gameTempDir,
    ];

    for (let dir of dirs) {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    }
  }
}

const paths = new Paths();
paths.init();
module.exports = paths;
