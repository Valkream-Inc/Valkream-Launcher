const { isForProduction } = require("./shared function/config.js");

const apiKey = isForProduction ? "" : "SECRET_API_KEY";
const apiToken = isForProduction ? "" : "SECRET_API_TOKEN";

module.exports = {
  apiKey,
  apiToken,
};
