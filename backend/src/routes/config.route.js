/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

var router = require("express").Router();
const ErrorHandler = require("../components/errorHandler.component.js");
const Auth = require("../components/auth.component.js");
const { LockHandler } = require("../components/lock.component.js");

const config = require("../controllers/config.controller.js");

module.exports = (app) => {
  router.post(
    "/config/change-event/",
    Auth.ensureIsAuthorized,
    ErrorHandler.Async(
      LockHandler("config", "critical")(config.config_change_event)
    )
  );
  router.post(
    "/config/change-maintenance/",
    Auth.ensureIsAuthorized,
    ErrorHandler.Async(
      LockHandler("config", "critical")(config.config_change_maintenance)
    )
  );

  app.use(router);
};
