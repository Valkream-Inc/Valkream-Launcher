const dev = process.env.NODE_ENV === "dev";

const baseUrl = dev
  ? "http://localhost:3000"
  : "https://play.valkream.com/Launcher";

module.exports = baseUrl;
