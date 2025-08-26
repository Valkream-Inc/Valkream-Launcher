require("dotenv").config();
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

const { ClientError } = require("./components/error.component.js");

const app = express();
app.set("trust proxy", true);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Middleware pour attacher req.ip
app.use((req, res, next) => {
  req.ip = req.ip || req.connection.remoteAddress;
  next();
});

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
      return next(
        new ClientError(
          "Origine non autorisée par la politique CORS.",
          403,
          req.ip,
          "CORS"
        )
      );
    }
    next();
  });
});

// Middleware de protection contre le DDoS (rate limiting)
const getLimiter = rateLimit({
  windowMs: 5000, // 5 secondes
  max: 500,
  message: "Trop de requêtes GET. Réessaie dans 5 secondes.",
  keyGenerator: (req) => req.ip,
  skip: (req) => req.method !== "GET",
});
const postLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 1,
  message: "Trop de requêtes POST. Réessaie dans 1 minute.",
  keyGenerator: (req) => req.ip,
  skip: (req) => req.method !== "POST",
});
app.use(getLimiter);
app.use(postLimiter);

// routes
app.get("/", (req, res) => res.status(200).send("Connected !"));
require("./routes/add_version.route.js")(app);
require("./routes/serve_file.route.js")(app);
require("./routes/change_version.route.js")(app);
require("./routes/get_old_version.route.js")(app);

require("./routes/config.route.js")(app);

//handle error
require("./configs/error.config.js")(app);

// Démarrer le serveur
app.listen(process.env.PORT, () => {
  console.log(
    `\n\n[${new Date().toLocaleString()}] 🚀 Serveur de mise à jour en écoute sur  http://localhost:${
      process.env.PORT
    }`
  );
});

// Better error handling
process.on("uncaughtException", function (err) {
  console.error("Uncaught Exception:", err);
  console.error("Stack:", err.stack);
  process.exit(1);
});

process.on("unhandledRejection", function (reason, promise) {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});
