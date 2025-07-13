const { Server } = require('@fabricio-191/valve-server-query');
const { serverInfos } = require(window.PathsManager.getConstants());


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
        const server = await Server(serverInfos);
        
        let info = await server.getInfo();
        ['appID','gameID','steamID'].forEach( item => info[item] = `${info[item]}`)

        let ping = server.lastPing;
        info.ping = ping;
        console.log("info: ", info);
        this.callback(info);
    } catch(err) {
        // console.log("error: ", err)
        let info = { 
            "status": "server offline",
            "players": {
                "online": 0,
                "max": 64
            },
            "ping": "timeout"
        }
        console.log("info: ", info)
        this.callback(info);
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
