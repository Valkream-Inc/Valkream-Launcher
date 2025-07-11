const { ClientError } = require("./error.compoment.js");
const { apiKey, apiToken } = process.env;

class Auth {
  ensureIsAuthorized = (req, res, next) => {
    const send_api_key = req.body.api_key;
    const send_api_token = req.body.api_token;

    if (send_api_key !== apiKey || send_api_token !== apiToken)
      throw new ClientError(
        "error_API key ou token invalide.",
        401,
        req.connection.remoteAddress,
        "Auth"
      );

    next();
  };
}

module.exports = new Auth();
