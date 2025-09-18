var router = require("express").Router();
const { temp } = require("../configs/storage.config.js");
const ErrorHandler = require("../components/errorHandler.component.js");
const Auth = require("../components/auth.component.js");
const { LockHandler } = require("../components/lock.component.js");

const add_version = require("../controllers/add_version.controller.js");

module.exports = (app) => {
  router.post(
    "/game/Valheim/latest",
    temp.single("file"),
    Auth.ensureIsAuthorized,
    ErrorHandler.Async(
      LockHandler("game", "critical")(add_version.add_version_game)
    )
  );

  router.post(
    "/launcher/latest",
    temp.single("file"),
    Auth.ensureIsAuthorized,
    ErrorHandler.Async(
      LockHandler("launcher", "critical")(add_version.add_version_launcher)
    )
  );

  app.use(router);
};
