/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

var router = require("express").Router();
const ErrorHandler = require("../components/errorHandler.component.js");
const Auth = require("../components/auth.component.js");
const { LockHandler } = require("../components/lock.component.js");

const change_version = require("../controllers/change_version.controller.js");

module.exports = (app) => {
  router.post(
    "/launcher/change/",
    Auth.ensureIsAuthorized,
    ErrorHandler.Async(
      LockHandler(
        "launcher",
        "critical"
      )(change_version.change_launcher_version)
    )
  );

  router.post(
    "/game/Valheim/change/",
    Auth.ensureIsAuthorized,
    ErrorHandler.Async(
      LockHandler("game", "critical")(change_version.change_game_version)
    )
  );

  app.use(router);
};
