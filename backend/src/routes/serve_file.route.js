/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

var router = require("express").Router();
const ErrorHandler = require("../components/errorHandler.component.js");
const { LockHandler } = require("../components/lock.component.js");

const serve_file = require("../controllers/serve_file.controller.js");

module.exports = (app) => {
  router.get(
    "/launcher/latest/:filename",
    ErrorHandler.Async(
      LockHandler("launcher", "serve")(serve_file.serve_launcher_file)
    )
  );

  router.get(
    "/game/Valheim/latest/:filename",
    ErrorHandler.Async(LockHandler("game", "serve")(serve_file.serve_game_file))
  );

  router.get(
    "/config/Valheim/:filename",
    ErrorHandler.Async(
      LockHandler("config", "serve")(serve_file.serve_valheim_config_file)
    )
  );
  router.get(
    "/config/SevenDtoD/:filename",
    ErrorHandler.Async(
      LockHandler("config", "serve")(serve_file.serve_sevendtod_config_file)
    )
  );

  app.use(router);
};
