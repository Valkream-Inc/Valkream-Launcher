/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

const log = require("../components/log.component.js");
const {
  ClientError,
  ServerError,
} = require("../components/error.component.js");

module.exports = (app) => {
  app.use((err, req, res, next) => {
    res.setHeader("Content-Type", "application/json");

    if (err instanceof ClientError) {
      log(err.user, err.process, err.message);
      res.status(err.statusCode).json({ err: err.message });
    } else if (err instanceof ServerError) {
      log(err.user, err.process, err.message);
      res.status(500).json({ err: "Internal server error" });
    } else {
      log(null, null, "warning_" + "Error not catch " + err.stack);
      res.status(500).json({ err: "Internal server error" });
    }
    next();
  });
};
