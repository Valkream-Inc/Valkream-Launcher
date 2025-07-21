const axios = require("axios");

const { isServerReachable } = require(window.PathsManager.getSharedUtils());
const { baseUrl } = require(window.PathsManager.getConstants());

class MaintenanceManager {
  constructor(callback) {
    this.callback = callback;
    this.interval = null;
  }

  init = () => {
    this.getMaintenance();
    this.interval = setInterval(this.getMaintenance, 5000);
  };

  getMaintenance = async () => {
    try {
      const isServerConnected = await isServerReachable();

      if (isServerConnected) {
        const res = await axios.get(`${baseUrl}/config/maintenance.json`);
        this.callback(res.data);
      }
    } catch (err) {
      console.error("Error getting Maintenance:", err.message);
    }
  };

  stop = () => {
    if (this.interval) {
      clearInterval(this.interval);
      console.log("Maintenance polling stopped.");
    }
  };
}

module.exports = MaintenanceManager;
