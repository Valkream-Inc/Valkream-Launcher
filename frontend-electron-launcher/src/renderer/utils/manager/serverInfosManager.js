const pkg = require('@fabricio-191/valve-server-query');
const { Server, RCON, MasterServer } = pkg;

const { baseUrl } = require(window.PathsManager.getConstants());

class ServerInfosManager {
  constructor(callback) {
    this.callback = callback;
    this.interval = null;
  }

  init = () => {
    this.getInfos();
    this.interval = setInterval(this.getInfos, 5000);
  };

  getInfos = async () => {
    try {
        const server = await Server({
            ip: '51.222.46.122',
            port: 2457,
            timeout: 3000,
        });
        
        let info = await server.getInfo();
        ['appID','gameID','steamID'].forEach( item => info[item] = `${info[item]}`)

        let ping = server.lastPing;
        info.ping = ping;
        console.log("info: ", info);
        this.callback(info);
    } catch(err) {
        console.log("error: ", err)
        info = { "status": "server offline" }
        console.log("info: ", info)
    }
  }


  stop = () => {
    if (this.interval) {
      clearInterval(this.interval);
      console.log("Event polling stopped.");
    }
  };
}

module.exports = ServerInfosManager;
