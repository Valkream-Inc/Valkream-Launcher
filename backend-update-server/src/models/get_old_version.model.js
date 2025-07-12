const fs = require("fs");

const { ServerError } = require("../components/error.component.js");
const Models = require("../components/models.component.js");

class GetOldVersion extends Models {
  constructor(props) {
    super(props);
    this.old_dir = props.old_dir;
  }

  static async init(props) {
    const { old_dir } = props;

    try {
      const data = fs.readdirSync(old_dir);

      return { msg: "Ancienne version récupérée avec succès.", data: data };
    } catch (err) {
      throw new ServerError(err, undefined, "Get old version");
    }
  }
}

module.exports = GetOldVersion;
