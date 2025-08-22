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
  getIsInternetConnected = async (hostname = "google.com") => {
    return await new Promise((resolve) => {
      dns.lookup(hostname, (err) => {
        if (err && err.code === "ENOTFOUND") {
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
  };

  getIsServerReachable = async (url = baseUrl) => {
    try {
      await axios.get(url, { timeout: 3000 });
      return true;
    } catch (error) {
      return false;
    }
  };

  getEvent = async () => {
    try {
      const res = await axios.get(LinksManager.eventUrl());
      return res.data;
    } catch (err) {
      console.error("Error getting Event:", err.message);
      return;
    }
  };

  getMaintenance = async () => {
    try {
      const res = await axios.get(LinksManager.maintenanceUrl());
      return res.data;
    } catch (err) {
      console.error("Error getting Maintenance:", err.message);
      return;
    }
  };

  getServerInfos = async () => {
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
  };
}

const infosManager = new InfosManager();
module.exports = infosManager;
