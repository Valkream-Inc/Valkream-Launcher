require("dotenv").config();

const express = require("express");
const multer = require("multer");
const fs = require("fs");
const fse = require("fs-extra");
const path = require("path");
const yaml = require("yaml");
const cors = require("cors");
// const rateLimit = require("express-rate-limit");

const { ClientError } = require("./compoment/error.compoment.js");

const { unZip } = require("valkream-function-lib");
const { apiKey, apiToken } = process.env;

const app = express();

const uploadsDir = path.join(__dirname, "../uploads");
const configDir = path.join(uploadsDir, "config");

const launcherDir = path.join(uploadsDir, "launcher");
const launcherLatestDir = path.join(launcherDir, "latest");
const launcherOldDir = path.join(launcherDir, "old");

const gameDir = path.join(uploadsDir, "game");
const gameLatestDir = path.join(gameDir, "latest");
const gameOldDir = path.join(gameDir, "old");

// Création des dossiers
[
  uploadsDir,
  configDir,
  launcherDir,
  launcherLatestDir,
  launcherOldDir,
  gameDir,
  gameLatestDir,
  gameOldDir,
].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);
});

// Config multer
const tempDir = path.join(__dirname, "temp");
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, tempDir),
  filename: (req, file, cb) => cb(null, file.originalname),
});
const upload = multer({ storage });
app.use(express.json());

// Middleware de protection contre le DDoS (rate limiting)
// const limiter = rateLimit({
//   windowMs: 10 * 1000, // 10 secondes
//   max: 100, // Limite chaque IP à 100 requêtes par fenêtre
//   message: {
//     error: "Trop de requêtes, merci de réessayer plus tard.",
//     code: 429,
//   },
//   standardHeaders: true, // Retourne les headers RateLimit-* standard
//   legacyHeaders: false, // Désactive les headers X-RateLimit-*
// });
// app.use(limiter);

// CORS configuration
const corsOptions = {
  origin: "*",
  methods: ["POST", "GET"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use((req, res, next) => {
  cors(corsOptions)(req, res, (err) => {
    if (err) {
      return new ClientError(
        "Origine non autorisée par la politique CORS.",
        403,
        req.connection.remoteAddress,
        "CORS"
      );
    }
    next();
  });
});

//get old version
app.get("/launcher/old/", (req, res) => {
  res.json(fs.readdirSync(launcherOldDir));
});

app.get("/game/old/", (req, res) => {
  res.json(fs.readdirSync(gameOldDir));
});

//change version
app.post("/launcher/change/", async (req, res) => {
  if (!req.body.version) return res.status(400).send("Version invalide");
  console.log(req.body.version);
  if (!ensureIsAuthorized(req, res)) return;

  const requestedVersion = req.body.version; // version demandée par le client

  if (!fs.readdirSync(launcherOldDir).includes(requestedVersion))
    return res.status(400).send("Version invalide");

  const versionFile = path.join(launcherLatestDir, "latest.yml");
  if (!fs.existsSync(versionFile)) {
    return res.status(400).send("Version invalide");
  }

  try {
    const ymlContent = fs.readFileSync(versionFile, "utf8");
    const parsed = yaml.parse(ymlContent);
    const currentVersion = parsed.version;

    const archivePath = path.join(launcherOldDir, currentVersion);

    // Déplacer la version actuelle dans le dossier old
    await fse.move(launcherLatestDir, archivePath, { overwrite: true });

    // Déplacer la version demandée dans latest
    await fse.move(
      path.join(launcherOldDir, requestedVersion),
      launcherLatestDir,
      {
        overwrite: true,
      }
    );

    res.status(200).send("Version changée avec succès");
  } catch (err) {
    console.error("Erreur lors du changement de version :", err);
    res.status(500).send("Erreur serveur");
  }
});

app.post("/game/change/", async (req, res) => {
  if (!req.body.version) return res.status(400).send("Version invalide");
  if (!ensureIsAuthorized(req, res)) return;

  const requestedVersion = req.body.version; // version demandée par le client

  if (!fs.readdirSync(gameOldDir).includes(requestedVersion))
    return res.status(400).send("Version invalide");

  const versionFile = path.join(gameLatestDir, "latest.yml");
  if (!fs.existsSync(versionFile)) {
    return res.status(400).send("Version invalide");
  }

  try {
    const ymlContent = fs.readFileSync(versionFile, "utf8");
    const parsed = yaml.parse(ymlContent);
    const currentVersion = parsed.version;

    const archivePath = path.join(gameOldDir, currentVersion);

    // Déplacer la version actuelle dans le dossier old
    await fse.move(gameLatestDir, archivePath, { overwrite: true });

    // Déplacer la version demandée dans latest
    await fse.move(path.join(gameOldDir, requestedVersion), gameLatestDir, {
      overwrite: true,
    });

    res.status(200).send("Version changée avec succès");
  } catch (err) {
    console.error("Erreur lors du changement de version :", err);
    res.status(500).send("Erreur serveur");
  }
});

// Fichier a deservir
app.get("/launcher/latest/:filename", (req, res) => {
  const filePath = path.join(launcherLatestDir, req.params.filename);
  console.log(filePath);
  if (!fs.existsSync(filePath)) {
    return res.status(404).send("Fichier introuvable");
  }
  res.download(filePath);
});

app.get("/game/latest/:filename", (req, res) => {
  const filePath = path.join(gameLatestDir, req.params.filename);
  console.log(filePath);
  if (!fs.existsSync(filePath)) {
    return res.status(404).send("Fichier introuvable");
  }
  res.download(filePath);
});

app.get("/config/:filename", (req, res) => {
  const filePath = path.join(configDir, req.params.filename);
  console.log(filePath);
  if (!fs.existsSync(filePath)) {
    return res.status(404).send("Fichier introuvable");
  }
  res.download(filePath);
});

// //post url
// app.post("/launcher/latest", upload.single("file"), async (req, res) => {
//   const zipPath = req.file.path;
//   if (ensureIsAuthorized(req, res)) {
//     try {
//       console.log("📦 Fichier ZIP reçu :", zipPath);
//       res.status(200).send("ok");

//       const ExtractDir = path.join(tempDir, "extract-launcher");
//       if (fs.existsSync(ExtractDir)) {
//         fs.rmSync(ExtractDir, { recursive: true, force: true });
//       }
//       fs.mkdirSync(ExtractDir, { recursive: true });

//       await unZip(zipPath, ExtractDir);

//       const versionFile = path.join(launcherLatestDir, "latest.yml");
//       if (fs.existsSync(versionFile)) {
//         const ymlContent = fs.readFileSync(versionFile, "utf8");
//         const parsed = yaml.parse(ymlContent);
//         const version = parsed.version;
//         const archivePath = path.join(launcherOldDir, version);

//         await fse.move(launcherLatestDir, archivePath, { overwrite: true });
//       }

//       fs.mkdirSync(launcherLatestDir, { recursive: true });
//       await fse.copy(ExtractDir, launcherLatestDir, { overwrite: true });

//       // Nettoyage
//       fs.rmSync(ExtractDir, { recursive: true, force: true });
//       fs.unlinkSync(zipPath);

//       console.log("\n✅ Mise à jour installée avec succès.");
//     } catch (err) {
//       console.error("❌ Erreur de mise à jour :", err);
//       res.status(500).send("Erreur lors de la mise à jour.");
//     }
//   }
// });

// app.post("/game/latest", upload.single("file"), async (req, res) => {
//   const zipPath = req.file.path;
//   if (ensureIsAuthorized(req, res)) {
//     try {
//       console.log("📦 Fichier ZIP reçu :", zipPath);
//       res.status(200).send("ok");

//       const ExtractDir = path.join(tempDir, "extract-game");
//       if (fs.existsSync(ExtractDir)) {
//         fs.rmSync(ExtractDir, { recursive: true, force: true });
//       }
//       fs.mkdirSync(ExtractDir, { recursive: true });

//       await unZip(zipPath, ExtractDir);

//       const versionFile = path.join(gameLatestDir, "latest.yml");
//       if (fs.existsSync(versionFile)) {
//         const ymlContent = fs.readFileSync(versionFile, "utf8");
//         const parsed = yaml.parse(ymlContent);
//         const version = parsed.version;
//         const archivePath = path.join(gameOldDir, version);

//         await fse.move(gameLatestDir, archivePath, { overwrite: true });
//       }

//       fs.mkdirSync(gameLatestDir, { recursive: true });
//       await fse.copy(ExtractDir, gameLatestDir, { overwrite: true });

//       // Nettoyage
//       fs.rmSync(ExtractDir, { recursive: true, force: true });
//       fs.unlinkSync(zipPath);

//       console.log("\n✅ Mise à jour installée avec succès.");
//     } catch (err) {
//       console.error("❌ Erreur de mise à jour :", err);
//       res.status(500).send("Erreur lors de la mise à jour.");
//     }
//   }
// });

//change event
app.post("/config/change-event/", async (req, res) => {
  if (!req.body.event) return res.status(400).send("Version invalide");
  if (!ensureIsAuthorized(req, res)) return;

  const requestedEvent = req.body.event;

  try {
    await fse.writeJson(path.join(configDir, "event.json"), requestedEvent, {
      spaces: 2,
    });
    res.status(200).send("Event changée avec succès");
  } catch (err) {
    console.error("Erreur lors du changement de configuration event :", err);
    res.status(500).send("Erreur serveur");
  }
});

const ensureIsAuthorized = (req, res) => {
  const send_api_key = req.body.api_key;
  const send_api_token = req.body.api_token;
  if (send_api_key !== apiKey || send_api_token !== apiToken) {
    res.status(401).send("❌ API key ou token invalide.");
  } else {
    return true;
  }
};

// routes
require("./routes/add_version.route.js")(app);

//handle error
require("./config/error.config.js")(app);

// Démarrer le serveur
app.listen(process.env.PORT, () => {
  console.log(
    `   
    
[${new Date().toLocaleString()}] 🚀 Serveur de mise à jour en écoute sur http://localhost:${
      process.env.PORT
    }`
  );
});

process.on("uncaughtException", function (e) {
  console.log("uncaughtException" + e);
});
