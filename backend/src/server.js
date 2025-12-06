const express = require("express");
const log = require("./components/log.component");

const app = express();

//PORT
const PORT = 3000;

// Midleware de debug
const loggerMiddleware = (req, res, next) => {
  const remoteAddress = req.ip || req.socket.remoteAddress;
  const resourcePath = req.url;
  log(remoteAddress, resourcePath);

  next();
};

app.use(loggerMiddleware);
app.use(express.static("public"));

// Home page
app.get("/", (req, res) => {
  res.send("Bienvenue sur le serveur statique de dev !");
});

// Erreur 404
app.use((req, res, next) => {
  res.status(404);
  res.type("txt").send("404 Not Found");
});

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(
    `\n\n[${new Date().toLocaleString()}] 🚀 Serveur de mise à jour en écoute sur  http://localhost:${PORT}`
  );
});

process.on("uncaughtException", function (err) {
  console.error("Uncaught Exception:", err);
  console.error("Stack:", err.stack);
  process.exit(1);
});

process.on("unhandledRejection", function (reason, promise) {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});
