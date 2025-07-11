const paths = require("../configs/paths.config");
const ServeFile = require("../models/serve_file.model.js");

exports.serve_launcher_file = (req, res) => {
  const filePath = ServeFile.getFilePath(
    new ServeFile({
      baseDir: paths.launcherLatestDir,
      filename: req.params.filename,
      user: req.connection.remoteAddress,
    })
  );
  res.download(filePath);
};

exports.serve_game_file = (req, res) => {
  const filePath = ServeFile.getFilePath(
    new ServeFile({
      baseDir: paths.gameLatestDir,
      filename: req.params.filename,
      user: req.connection.remoteAddress,
    })
  );
  res.download(filePath);
};

exports.serve_config_file = (req, res) => {
  const filePath = ServeFile.getFilePath(
    new ServeFile({
      baseDir: paths.configDir,
      filename: req.params.filename,
      user: req.connection.remoteAddress,
    })
  );
  res.download(filePath);
};
