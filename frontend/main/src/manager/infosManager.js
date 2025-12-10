/**
 * @author Valkream Team
 * @license MIT-NC
 */

const axios = require("axios");
const dns = require("dns");
const { GameDig } = require("gamedig");

const { baseUrl, serversInfos } = require("../constants");
const LinksManager = require("./linksManager");

class InfosManager {
  constructor() {
    this.isServerReachable = null;
  }

  async getIsServerReachableFromInternal(forceRefresh = false) {
    if (this.isServerReachable === null || forceRefresh) {
      await this.getIsServerReachable();
    }
    return this.isServerReachable;
  }

  async getIsInternetConnected(hostname = "google.com") {
    return new Promise((resolve) => {
      dns.lookup(hostname, (err) => {
        resolve(!(err && err.code === "ENOTFOUND"));
      });
    });
  }

  async getIsServerReachable(url = baseUrl) {
    try {
      await axios.get(url, { timeout: 3000 });
      this.isServerReachable = true;
      return true;
    } catch (error) {
      console.error("Error checking server reachability:", error.message);
      this.isServerReachable = false;
      return false;
    }
  }

  async getEvent(game) {
    try {
      if (!(await this.getIsServerReachableFromInternal())) return false;
      const res = await axios.get(LinksManager.eventUrl(game), {
        timeout: 3000,
      });
      return res.data;
    } catch (err) {
      console.error("Error getting Event:", err.message);
      return false;
    }
  }

  async getMaintenance(game) {
    try {
      if (!(await this.getIsServerReachableFromInternal())) return false;
      const res = await axios.get(LinksManager.maintenanceUrl(game), {
        timeout: 3000,
      });
      return res.data;
    } catch (err) {
      console.error("Error getting Maintenance:", err.message);
      return false;
    }
  }

  async getServerInfos(game) {
    try {
      const res = await GameDig.query(serversInfos[game]);

      return {
        status: "server online",
        players: {
          online: res.numplayers,
          max: res.maxplayers,
        },
        ping: res.ping,
      };
    } catch (err) {
      console.error("Error getting server infos:", err.message);
      return { status: "server offline" };
    }
  }
}

module.exports = new InfosManager();
