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
  }

  async init(sender) {
    this.sender = sender;

    await this.updateInfos(); // premier update direct
    this.interval = setInterval(this.updateInfos, refreshTimeout);
  }

  updateInfos = async () => {
    this.infos = await this.checkInfos();

    if (this.sender) {
      this.sender.send(`update-infos`, this.infos);
    }
  };

  checkInfos = async () => {
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
