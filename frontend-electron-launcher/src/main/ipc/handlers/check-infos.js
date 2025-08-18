/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */
const InfosManager = require("../../manager/infosManager");
const { refreshTimeout } = require("../../constants");

class CheckInfos {
  constructor() {
    this.interval = null;
  }

  async init() {
    this.updateInfos();
    this.interval = setInterval(this.updateInfos, refreshTimeout);
  }

  updateInfos = async () => {
    this.infos = await this.checkInfos();
  };

  checkInfos = async () => {
    const [isInternetConnected, isServerReachable, serverInfos] =
      await Promise.all([
        InfosManager.getIsInternetConnected(),
        InfosManager.getIsServerReachable(),
        InfosManager.getServerInfos(),
      ]);

    if (!isServerReachable)
      return { isInternetConnected, isServerReachable, serverInfos };

    const [event, maintenance] = await Promise.all([
      InfosManager.getEvent(),
      InfosManager.getMaintenance(),
    ]);

    return {
      isInternetConnected,
      isServerReachable,
      serverInfos,
      event,
      maintenance,
    };
  };

  getInfos = async () => {
    if (!this.infos) await this.updateInfos();
    return this.infos;
  };

  stop = () => {
    if (this.interval) clearInterval(this.interval);
  };
}

const checkInfos = new CheckInfos();
checkInfos.init();
module.exports = checkInfos;
