const dev = process.env.NODE_ENV === "dev";

const baseUrl = dev ? "http://localhost:3000" : "https://release.valkream.com";

module.exports = baseUrl;
