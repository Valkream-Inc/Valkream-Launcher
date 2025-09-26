/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

const axios = require("axios");
const dns = require("dns");
const { Server } = require("@fabricio-191/valve-server-query");

const { baseUrl, serverInfos } = require("../constants");
const LinksManager = require("./linksManager");

class InfosManager {
  constructor() {
    this.isServerReachable = null;
    this.server = null;
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

  async getEvent() {
    try {
      if (!(await this.getIsServerReachableFromInternal())) return null;
      const res = await axios.get(LinksManager.eventUrl(), { timeout: 3000 });
      return res.data;
    } catch (err) {
      console.error("Error getting Event:", err.message);
      return null;
    }
  }

  async getMaintenance() {
    try {
      if (!(await this.getIsServerReachableFromInternal())) return null;
      const res = await axios.get(LinksManager.maintenanceUrl(), {
        timeout: 3000,
      });
      return res.data;
    } catch (err) {
      console.error("Error getting Maintenance:", err.message);
      return null;
    }
  }

  async getServerInfos() {
    try {
      if (!this.server) this.server = await Server(serverInfos);
      const res = await this.server.getInfo();

      return {
        status: "server online",
        players: res.players,
        ping: this.server.lastPing,
      };
    } catch (err) {
      console.error("Error setting server:", err.message);
      return { status: "server offline" };
    }
  }
}

module.exports = new InfosManager();
