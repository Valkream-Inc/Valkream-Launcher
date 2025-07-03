const axios = require("axios");

const baseUrl = require("../baseUrl");

class EventManager {
  constructor(callback) {
    this.callback = callback;
    this.interval = null;
  }

  init = () => {
    this.getEvent();
    this.interval = setInterval(this.getEvent, 5000);
  };

  getEvent = async () => {
    try {
      const res = await axios.get(`${baseUrl}/config/event.json`);
      this.callback(res.data);
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

export default EventManager;
