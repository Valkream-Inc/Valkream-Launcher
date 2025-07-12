const paths = require("../configs/paths.config");
const ChangeVersion = require("../models/change_version.model.js");
const log = require("../components/log.component.js");
const { ClientError } = require("../components/error.component.js");

exports.change_launcher_version = async (req, res) => {
  if (!req.body.version)
    throw new ClientError(
      "error_empty_info",
      400,
      req.connection.remoteAddress,
      "change_launcher_version"
    );

  const data = await ChangeVersion.init({
    latestDir: paths.launcherLatestDir,
    oldDir: paths.launcherOldDir,
    requestedVersion: req.body.version,
    user: req.connection.remoteAddress,
  });

  log(req.connection.remoteAddress, "change_launcher_version", data.msg);
  res.status(200).send(data);
};

exports.change_game_version = async (req, res) => {
  if (!req.body.version)
    throw new ClientError(
      "error_empty_info",
      400,
      req.connection.remoteAddress,
      "change_game_version"
    );

  const data = await ChangeVersion.init({
    latestDir: paths.gameLatestDir,
    oldDir: paths.gameOldDir,
    requestedVersion: req.body.version,
    user: req.connection.remoteAddress,
  });

  log(req.connection.remoteAddress, "change_game_version", data.msg);
  res.status(200).send(data);
};
