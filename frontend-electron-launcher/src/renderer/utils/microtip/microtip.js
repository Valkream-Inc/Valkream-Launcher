const injectCSS = require("../inject-css");

class Microtip {
  static init() {
    injectCSS("microtip-css", require("./microtip.css"));
  }
}

module.exports = Microtip;
