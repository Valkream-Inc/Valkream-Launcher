var router = require("express").Router();
const ErrorHandler = require("../components/errorHandler.component.js");
const Auth = require("../components/auth.component.js");
const config = require("../controllers/config.controller.js");

module.exports = (app) => {
  router.post(
    "/config/change-event/",
    Auth.ensureIsAuthorized,
    ErrorHandler.Async(config.config_change_event)
  );

  app.use(router);
};
