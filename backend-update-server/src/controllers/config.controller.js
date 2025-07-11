const paths = require("../configs/paths.config");
const Config = require("../models/config.model.js");

const { ClientError } = require("../components/error.component.js");

exports.config_change_event = async (req, res) => {
  if (!req.body.event)
    throw new ClientError(
      "error_empty_info",
      400,
      req.connection.remoteAddress,
      "change_event"
    );

  const data = await Config.changeEvent(
    new Config({
      configDir: paths.configDir,
      event: req.body.event,
      user: req.connection.remoteAddress,
    })
  );

  res.status(200).send(data.msg);
};
