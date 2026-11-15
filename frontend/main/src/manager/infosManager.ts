/**
 * @author Valkream Team
 * @license MIT-NC
 */

const axios = require("axios");
const dns = require("dns");
const { GameDig } = require("gamedig");

const { baseUrl, serversInfos } = require("../constants");
const LinksManager = require("./linksManager");
const noCache = require("../constants/noCaheHeader");
const { toValidUrl } = require("../utils");

class InfosManager {
  constructor() {
    this.isServerReachable = null;
    this.isInternetConnected = null;
  }

  async getIsInternetConnected(hostname = "google.com", force = false) {
    if (!force && this.isInternetConnected !== null)
      return this.isInternetConnected;

    return new Promise((resolve) => {
      dns.lookup(hostname, (err) => {
        resolve(!(err && err.code === "ENOTFOUND"));
      });
    });
  }

  async getIsServerReachable(url = baseUrl, force = false) {
    if (!force && this.isServerReachable !== null)
      return this.isServerReachable;

    try {
      await axios.get(url, { timeout: 3000, ...noCache });
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
      if (!(await this.getIsServerReachable())) return false;
      const res = await axios.get(LinksManager.eventUrl(game), {
        timeout: 3000,
        ...noCache,
      });
      return {
        ...res.data,
        image: res.data.image.startsWith("data:")
          ? res.data.image
          : toValidUrl(res.data.image),
      };
    } catch (err) {
      console.error("Error getting Event:", err.message);
      return false;
    }
  }

  async getMaintenance(game) {
    try {
      if (!(await this.getIsServerReachable())) return false;
      const res = await axios.get(LinksManager.maintenanceUrl(game), {
        timeout: 3000,
        ...noCache,
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
