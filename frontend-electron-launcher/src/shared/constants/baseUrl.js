const dev = process.env.NODE_ENV === "dev";

const baseUrl = dev ? "http://localhost:3000" : "http://51.222.46.122:3001";

module.exports = baseUrl;
