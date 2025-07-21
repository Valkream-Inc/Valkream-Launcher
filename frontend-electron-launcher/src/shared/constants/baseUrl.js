const dev = process.env.NODE_ENV === "dev" || window?.__DEV__;

const baseUrl = dev ? "http://localhost:3000" : "https://release.valkream.com";

module.exports = baseUrl;
