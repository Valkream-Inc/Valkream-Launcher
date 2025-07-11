var router = require("express").Router();
const ErrorHandler = require("../components/errorHandler.component.js");

const serve_file = require("../controllers/serve_file.controller.js");

module.exports = (app) => {
  router.get(
    "/launcher/latest/:filename",
    ErrorHandler.Async(serve_file.serve_launcher_file)
  );

  router.get(
    "/game/latest/:filename",
    ErrorHandler.Async(serve_file.serve_game_file)
  );

  router.get(
    "/config/:filename",
    ErrorHandler.Async(serve_file.serve_config_file)
  );

  app.use(router);
};
