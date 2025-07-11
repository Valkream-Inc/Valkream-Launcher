const fs = require("fs");

const { ServerError } = require("../compoment/error.compoment");

const GetOldVersion = function (props) {
  this.old_dir = props.old_dir;
};

GetOldVersion.init = async (props) => {
  const oldDir = props.old_dir;
  try {
    const data = fs.readdirSync(oldDir);

    return { msg: "✅ Ancienne version récupérée avec succès.", data: data };
  } catch (err) {
    throw new ServerError(err, props.user, "Get old version");
  }
};

module.exports = GetOldVersion;
