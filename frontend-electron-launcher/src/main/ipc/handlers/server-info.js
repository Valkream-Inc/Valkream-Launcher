/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

const { PathsManager } = require("../../../shared/utils/shared-utils");

const { Server } = require("@fabricio-191/valve-server-query");
const { serverInfos } = require(PathsManager.getConstants());

class ServerInfo {
  async init(event) {
    this.event = event;
    this.server = await this.setServer();
    this.interval = null;

    this.getServerInfo();
    this.interval = setInterval(this.getServerInfo, 1000);
  }

  setServer = async () => {
    try {
      const server = await Server(serverInfos);
      return server;
    } catch (err) {
      return null;
    }
  };

  getServerInfo = async () => {
    try {
      if (!this.server) this.server = await this.setServer();
      let res = await this.server.getInfo();
      await this.event.reply("update-server-info", {
        status: "server online",
        players: res.players,
        ping: this.server.lastPing,
      });
    } catch (err) {
      await this.event.reply("update-server-info", {
        status: "server offline",
      });
    }
  };

  stop = () => {
    if (this.interval) clearInterval(this.interval);
  };
}

module.exports = ServerInfo;
