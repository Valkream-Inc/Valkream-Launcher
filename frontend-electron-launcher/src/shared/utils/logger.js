/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

let console_log = console.log;
let console_info = console.info;
let console_warn = console.warn;
let console_debug = console.debug;
let console_error = console.error;

const pkg = require("../../../package.json");
class Logger {
  static name = pkg.name;
  static color = "#2df705";

  static configure(name, color) {
    Logger.name = name || "App";
    Logger.color = color || "#00bfff";
  }

  static log(...args) {
    console_log.call(
      console,
      `%c[${Logger.name}]:`,
      `color: ${Logger.color};`,
      ...args
    );
  }
  static info(...args) {
    console_info.call(
      console,
      `%c[${Logger.name}]:`,
      `color: ${Logger.color};`,
      ...args
    );
  }
  static warn(...args) {
    console_warn.call(
      console,
      `%c[${Logger.name}]:`,
      `color: ${Logger.color};`,
      ...args
    );
  }
  static debug(...args) {
    console_debug.call(
      console,
      `%c[${Logger.name}]:`,
      `color: ${Logger.color};`,
      ...args
    );
  }
  static error(...args) {
    console_error.call(console, `%c[${Logger.name}]:`, `color: red;`, ...args);
  }
}

module.exports = Logger;
