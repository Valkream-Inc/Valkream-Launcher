const packageJson = require("../package.json");
const dev = process.env.NODE_ENV === "dev" || process.env.DEV_TOOL === "open";
const baseUrl = dev ? packageJson.url.baseUrlDev : packageJson.url.baseUrl;

module.exports = baseUrl;
