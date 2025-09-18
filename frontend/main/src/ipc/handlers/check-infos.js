/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */
const InfosManager = require("../../manager/infosManager");

class CheckInfos {
  get = async () => {
    const [serverInfos, event, maintenance] = await Promise.all([
      InfosManager.getServerInfos(),
      InfosManager.getEvent(),
      InfosManager.getMaintenance(),
    ]);

    return {
      serverInfos,
      event,
      maintenance,
    };
  };
}

const checkInfos = new CheckInfos();
module.exports = checkInfos;
