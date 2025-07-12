const dev = process.env.NODE_ENV === "dev" || process.env.DEV_TOOL === "open";

const baseUrl = dev ? "http://localhost:3000" : "https://valkream-launcher.fr";

module.exports = baseUrl;
