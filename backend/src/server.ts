/**
 * @author Valkream Team
 * @license MIT-NC
 */

import { createApp } from "./app";

const PORT = 3000;

createApp().listen(PORT, () => {
  console.log(
    `\n\n[${new Date().toLocaleString()}] 🚀 Serveur de mise à jour en écoute sur  http://localhost:${PORT}`,
  );
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  console.error("Stack:", err.stack);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});
