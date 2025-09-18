const { ClientError } = require("./error.component.js");
const { apiKey, apiToken } = process.env;

class Auth {
  ensureIsAuthorized = (req, res, next) => {
    if (!req || !req.body || !req.body.api_key || !req.body.api_token) {
      throw new ClientError(
        "error_empty_info",
        400,
        req && req.ip ? req.ip : undefined,
        "Auth"
      );
    }
    const send_api_key = req.body.api_key;
    const send_api_token = req.body.api_token;

    if (send_api_key !== apiKey || send_api_token !== apiToken)
      throw new ClientError(
        "error_API key ou token invalide.",
        401,
        req.ip,
        "Auth"
      );

    next();
  };
}

module.exports = new Auth();
