/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

const axios = require("axios");

const { baseUrl } = require(window.PathsManager.getConstants());

class EventManager {
  constructor(callback) {
    this.callback = callback;
    this.interval = null;
  }

  init = () => {
    if (
      window.isServerReachable === undefined ||
      window.isServerReachable === null
    )
      return setTimeout(() => this.init(), 100);

    this.getEvent();
    this.interval = setInterval(this.getEvent, 5000);
  };

  getEvent = async () => {
    try {
      if (window.isServerReachable) {
        const res = await axios.get(`${baseUrl}/config/event.json`);
        this.callback(res.data);
      }
    } catch (err) {
      console.error("Error getting event:", err.message);
    }
  };

  stop = () => {
    if (this.interval) {
      clearInterval(this.interval);
      console.log("Event polling stopped.");
    }
  };
}

module.exports = EventManager;
