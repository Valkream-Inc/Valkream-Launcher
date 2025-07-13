const { PathsManager } = require("../../../shared/utils/shared-utils");

const { Server } = require("@fabricio-191/valve-server-query");
const { serverInfos } = require(PathsManager.getConstants());

class ServerInfo {
  async init(event) {
    this.event = event;
    this.server = await Server(serverInfos);
    this.interval = null;

    this.getServerInfo();
    this.interval = setInterval(this.getServerInfo, 1000);
  }

  getServerInfo = async () => {
    try {
      let res = await this.server.getInfo();
      this.event.reply("update-server-info", {
        status: "server online",
        players: res.players,
        ping: this.server.lastPing,
      });
    } catch (err) {
      this.event.reply("update-server-info", {
        status: "server offline",
      });
      console.log("error server info", err);
    }
  };

  stop = () => {
    if (this.interval) clearInterval(this.interval);
  };
}

module.exports = ServerInfo;
