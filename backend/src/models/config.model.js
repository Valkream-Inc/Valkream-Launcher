const fse = require("fs-extra");
const path = require("path");

const { ServerError } = require("../components/error.component");
const Models = require("../components/models.component.js");

class Config extends Models {
  constructor(props) {
    super(props);
    this.configDir = props.configDir;
    this.data = props.data;
  }

  static async changeEvent(props) {
    const { configDir, data, user } = props;
    try {
      await fse.writeJson(path.join(configDir, "event.json"), data, {
        spaces: 2,
      });
      return { msg: "Event changée avec succès" };
    } catch (err) {
      throw new ServerError(err, user, "change_event");
    }
  }

  static async changeMaintenance(props) {
    const { configDir, data, user } = props;
    try {
      await fse.writeJson(path.join(configDir, "maintenance.json"), data, {
        spaces: 2,
      });
      return { msg: "Maintenance changée avec succès" };
    } catch (err) {
      throw new ServerError(err, user, "change_maintenance");
    }
  }
}

module.exports = Config;
