const path = require("path");

module.exports = {
  webpack: {
    configure: (config) => {
      // Point d'entrée React
      config.entry = path.resolve(__dirname, "renderer/index.js");

      // Sortie dans renderer/build
      config.output = {
        ...config.output,
        path: path.resolve(__dirname, "renderer/build"),
        publicPath: "/", // pour React Router
      };

      return config;
    },
  },
  devServer: (devServerConfig) => {
    // Dire à CRA que "public" est dans /renderer/public
    devServerConfig.static = {
      directory: path.resolve(__dirname, "renderer/public"),
    };
    return devServerConfig;
  },
  paths: function (paths) {
    // Racine React
    paths.appSrc = path.resolve(__dirname, "renderer");
    paths.appIndexJs = path.resolve(__dirname, "renderer/index.js");

    // Public → renderer/public
    paths.appPublic = path.resolve(__dirname, "renderer/public");
    paths.appHtml = path.resolve(__dirname, "renderer/public/index.html");

    // Build → renderer/build
    paths.appBuild = path.resolve(__dirname, "renderer/build");

    return paths;
  },
};
