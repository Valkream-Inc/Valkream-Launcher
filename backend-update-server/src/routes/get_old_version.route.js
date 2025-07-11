var router = require("express").Router();
const ErrorHandler = require("../components/errorHandler.component.js");

const get_old_version = require("../controllers/get_old_version.controller.js");

module.exports = (app) => {
  router.get(
    "/game/old",
    ErrorHandler.Async(get_old_version.get_old_version_game)
  );

  router.get(
    "/launcher/old",
    ErrorHandler.Async(get_old_version.get_old_version_launcher)
  );

  app.use(router);
};
