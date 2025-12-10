/**
 * @author Valkream Team
 * @license MIT-NC
 */

const InfosManager = require("../../manager/infosManager");

async function CheckInfos(game) {
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
}

module.exports = CheckInfos;
