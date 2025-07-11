const fse = require("fs-extra");
const path = require("path");

const { ServerError } = require("../components/error.component");
const Models = require("../components/models.component.js");

class Config extends Models {
  constructor(props) {
    super();
    this.configDir = props.configDir;
    this.event = props.event;
  }

  static async changeEvent(props) {
    const { configDir, event, user } = props;
    try {
      await fse.writeJson(path.join(configDir, "event.json"), event, {
        spaces: 2,
      });
      return { msg: "Event changée avec succès" };
    } catch (err) {
      throw new ServerError(err, user, "change_event");
    }
  }
}

module.exports = Config;
