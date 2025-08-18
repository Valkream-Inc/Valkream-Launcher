/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

const { Server } = require("@fabricio-191/valve-server-query");
const { serverInfos, refreshTimeout } = require("../../constants/constants");

class ServerManager {
  async init(callback = async () => {}) {
    this.callback = callback;
    this.server = await this.setServer();

    this.getServerInfo();
    this.interval = setInterval(this.getServerInfo, refreshTimeout);
  }

  setServer = async () => {
    try {
      return (this.server = await Server(serverInfos));
    } catch (err) {
      console.error("Error setting server:", err.message);
    }
  };

  getServerInfo = async () => {
    try {
      if (!this.server) await this.setServer();
      let res = await this.server.getInfo();

      await this.callback({
        status: "server online",
        players: res.players,
        ping: this.server.lastPing,
      });
    } catch (err) {
      console.error("Error getting server info:", err.message);

      await this.callback({
        status: "server offline",
      });
    }
  };

  stop = () => {
    if (this.interval) clearInterval(this.interval);
  };
}

module.exports = ServerManager;
