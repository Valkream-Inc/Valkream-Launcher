/**
 * @author Valkream Team
 * @license MIT-NC
 */

import express from "express";
import type { NextFunction, Request, Response } from "express";

import log from "./components/log.component";

const app = express();

//PORT
const PORT = 3000;

// Midleware de debug
const loggerMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  const remoteAddress = req.ip || req.socket.remoteAddress;
  const resourcePath = req.url;
  log(remoteAddress, resourcePath);

  next();
};

app.use(loggerMiddleware);
app.use(
  express.static("public", {
    dotfiles: "allow",
  }),
);

// Home page
app.get("/", (_req: Request, res: Response) => {
  res.send("Bienvenue sur le serveur statique de dev !");
});

// Erreur 404
app.use((_req: Request, res: Response) => {
  res.status(404);
  res.type("txt").send("404 Not Found");
});

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(
    `\n\n[${new Date().toLocaleString()}] 🚀 Serveur de mise à jour en écoute sur  http://localhost:${PORT}`,
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
