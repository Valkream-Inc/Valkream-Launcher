/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

const log = require("../components/log.component.js");
const GetOldVersion = require("../models/get_old_version.model.js");
const paths = require("../configs/paths.config");

exports.get_old_version_game = async (req, res) => {
  const data = await GetOldVersion.init(
    new GetOldVersion({
      old_dir: paths.gameOldDir,
      user: req.ip,
    })
  );

  log(req.ip, "get_old_version_game", data.msg);
  return res.status(200).send(data);
};

exports.get_old_version_launcher = async (req, res) => {
  const data = await GetOldVersion.init(
    new GetOldVersion({
      old_dir: paths.launcherOldDir,
      user: req.ip,
    })
  );

  log(req.ip, "get_old_version_launcher", data.msg);
  return res.status(200).send(data);
};
