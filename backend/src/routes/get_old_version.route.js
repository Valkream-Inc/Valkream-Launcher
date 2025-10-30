/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

var router = require("express").Router();
const ErrorHandler = require("../components/errorHandler.component.js");
const { LockHandler } = require("../components/lock.component.js");

const get_old_version = require("../controllers/get_old_version.controller.js");

module.exports = (app) => {
  router.get(
    "/game/Valheim/old",
    ErrorHandler.Async(
      LockHandler("game", "serve")(get_old_version.get_old_version_game)
    )
  );

  router.get(
    "/launcher/old",
    ErrorHandler.Async(
      LockHandler("launcher", "serve")(get_old_version.get_old_version_launcher)
    )
  );

  app.use(router);
};
