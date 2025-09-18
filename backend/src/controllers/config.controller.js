const paths = require("../configs/paths.config");
const log = require("../components/log.component.js");
const { ClientError } = require("../components/error.component.js");

const Config = require("../models/config.model.js");

exports.config_change_event = async (req, res) => {
  if (!req.body.event)
    throw new ClientError("error_empty_info", 400, req.ip, "change_event");

  const data = await Config.changeEvent(
    new Config({
      configDir: paths.configUploadDir,
      data: req.body.event,
      user: req.ip,
    })
  );

  log(req.ip, "change_event", data.msg);
  res.status(200).send(data);
};

exports.config_change_maintenance = async (req, res) => {
  if (!req.body.maintenance)
    throw new ClientError(
      "error_empty_info",
      400,
      req.ip,
      "change_maintenance"
    );

  const data = await Config.changeMaintenance(
    new Config({
      configDir: paths.configUploadDir,
      data: req.body.maintenance,
      user: req.ip,
    })
  );

  log(req.ip, "change_maintenance", data.msg);
  res.status(200).send(data);
};
