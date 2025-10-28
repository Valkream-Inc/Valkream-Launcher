/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

const log = require("../components/log.component.js");
const { ClientError } = require("../components/error.component.js");
const AddVersion = require("../models/add_version.model.js");
const paths = require("../configs/paths.config");

exports.add_version_game = async (req, res) => {
  if (!req.file || !req.file.path)
    throw new ClientError("error_empty_info", 400, req.ip, "add_version_game");

  res.setHeader("Content-Type", "text/plain; charset=utf-8; stream");

  const data = await AddVersion.init(
    new AddVersion({
      zip_path: req.file.path,
      latest_dir: paths.gameLatestDir,
      old_dir: paths.gameOldDir,
      extract_dir: paths.gameTempDir,
      user: req.ip,
    }),
    (progressMsg) => {
      res.write(progressMsg + "\n");
    }
  );

  log(req.ip, "add_version_game", data.msg);
  res.write(data.msg + "\n");
  return res.end();
};

exports.add_version_launcher = async (req, res) => {
  if (!req.file || !req.file.path)
    throw new ClientError(
      "error_empty_info",
      400,
      req.ip,
      "add_version_launcher"
    );

  res.setHeader("Content-Type", "text/plain; charset=utf-8; stream");

  const data = await AddVersion.init(
    new AddVersion({
      zip_path: req.file.path,
      latest_dir: paths.launcherLatestDir,
      old_dir: paths.launcherOldDir,
      extract_dir: paths.launcherTempDir,
      user: req.ip,
    }),
    (progressMsg) => {
      res.write(progressMsg + "\n");
    }
  );

  log(req.ip, "add_version_launcher", data.msg);
  res.write(data.msg + "\n");
  return res.end();
};
