/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */
const InfosManager = require("../../manager/infosManager");

class CheckInfos {
  get = async (game) => {
    const [serverInfos, event, maintenance] = await Promise.all([
      InfosManager.getServerInfos(game),
      InfosManager.getEvent(game),
      InfosManager.getMaintenance(game),
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
