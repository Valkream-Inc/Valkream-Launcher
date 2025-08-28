const path = require("path");
const paths = require("../configs/paths.config");
const log = require("../components/log.component.js");
const ServeFile = require("../models/serve_file.model.js");

exports.serve_launcher_file = (req, res) => {
  const filePath = ServeFile.getFilePath(
    new ServeFile({
      baseDir: paths.launcherLatestDir,
      filename: req.params.filename,
      user: req.ip,
    })
  );

  log(req.ip, "serve_launcher_file", path.basename(filePath));
  res.download(filePath);
};

exports.serve_game_file = (req, res) => {
  const filePath = ServeFile.getFilePath(
    new ServeFile({
      baseDir: paths.gameLatestDir,
      filename: req.params.filename,
      user: req.ip,
    })
  );

  log(req.ip, "serve_game_file", path.basename(filePath));
  res.download(filePath);
};

exports.serve_config_file = (req, res) => {
  const filePath = ServeFile.getFilePath(
    new ServeFile({
      baseDir: paths.configUploadDir,
      filename: req.params.filename,
      user: req.ip,
    })
  );

  log(req.ip, "serve_config_file", path.basename(filePath));
  res.download(filePath);
};
