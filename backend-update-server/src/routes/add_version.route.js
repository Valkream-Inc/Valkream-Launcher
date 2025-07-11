var router = require("express").Router();
const { temp } = require("../config/storage.config.js");
const ErrorHandler = require("../compoment/errorHandler.component.js");
const Auth = require("../compoment/auth.component.js");

const add_version = require("../controllers/add_version.controller.js");

module.exports = (app) => {
  router.post(
    "/game/latest",
    temp.single("file"),
    Auth.ensureIsAuthorized,
    ErrorHandler.Async(add_version.add_version_game)
  );

  router.post(
    "/launcher/latest",
    temp.single("file"),
    Auth.ensureIsAuthorized,
    ErrorHandler.Async(add_version.add_version_launcher)
  );

  app.use(router);
};
