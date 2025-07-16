const path = require("path");
const { spawn } = require("child_process");

const { PathsManager } = require("../../../shared/utils/shared-utils");

const STEAMCMD_PATH = path.join(
  PathsManager.getAssetsPath(),
  "CMD",
  "steamcmd.exe"
);
const APP_ID_VALHEIM = 892970;

class UpdateValheim {
  async init(event, updateDir) {
    this.event = event;
    this.updateDir = updateDir;

    const args = [
      "+force_install_dir",
      this.updateDir,
      "+login",
      "anonymous",
      "+app_update",
      `${APP_ID_VALHEIM}`,
      "validate",
      "+quit",
    ];

    const child = spawn(STEAMCMD_PATH, args, {
      cwd: path.dirname(STEAMCMD_PATH),
    });

    child.stdout.on("data", (data) => {
      this.event.sender.send("valheim:update:log", data.toString());
    });

    child.stderr.on("data", (data) => {
      this.event.sender.send("valheim:update:error", data.toString());
    });

    child.on("close", (code) => {
      this.event.sender.send("valheim:update:done", code === 0);
    });
  }
}

module.exports = UpdateValheim;
