/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Application Express : sert `public/` (configs, latest, fichiers des jeux) tel quel.
 */

import type { Request, Response } from "express";
import express from "express";

import { requestLogger } from "./lib/request-log";

const DEBUG = false;

export const createApp = () => {
  const app = express();

  app.use(requestLogger(DEBUG));
  app.use(express.static("public", { dotfiles: "allow" }));

  app.get("/", (_req: Request, res: Response) => {
    res.send("Bienvenue sur le serveur statique de dev !");
  });

  app.use((_req: Request, res: Response) => {
    res.status(404);
    res.type("txt").send("404 Not Found");
  });

  return app;
};
