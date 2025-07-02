const isForProduction = false;
const baseUrl = isForProduction ? "" : "http://localhost:3000";

const gameFolderToClean = [
  "/BepInEx/cache",
  "/BepInEx/config/wackysDatabase/Cache",
  "/BepInEx/config/Marketplace/SavedData",
];

const config = {
  isForProduction,
  baseUrl,
  gameFolderToClean,
};

module.exports = config;
