const log = require("../compoment/log.compoment.js");
const GetOldVersion = require("../models/get_old_version.model.js");
const paths = require("../config/paths.config");

exports.get_old_version_game = async (req, res) => {
  const data = await GetOldVersion.init(
    new GetOldVersion({
      old_dir: paths.gameOldDir,
    })
  );

  log(req.body.email, "upload photo_profile", data.msg);
  return res.status(200).send(data);
};

exports.get_old_version_launcher = async (req, res) => {
  const data = await GetOldVersion.init(
    new GetOldVersion({
      old_dir: paths.launcherOldDir,
    })
  );

  log(req.body.email, "upload photo_profile", data.msg);
  return res.status(200).send(data);
};
