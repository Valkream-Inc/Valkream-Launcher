/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */
const InfosManager = require("../../manager/infosManager");
const { refreshTimeout } = require("../../constants");

class CheckInfos {
  constructor() {
    this.interval = null;
    this.sender = null;
    this.processId = null;
  }

  async init(sender, processId) {
    this.sender = sender;
    this.processId = processId;

    await this.updateInfos(); // premier update direct
    this.interval = setInterval(this.updateInfos, refreshTimeout);
  }

  updateInfos = async () => {
    this.infos = await this.checkInfos();

    if (this.sender && this.processId) {
      this.sender.send(`update-infos-${this.processId}`, this.infos);
    }
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
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  };
}

const checkInfos = new CheckInfos();
module.exports = checkInfos;
