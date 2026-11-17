const games = () => [
  {
    id: "Valheim-Valkream-v2",
    server: "gamedig info",
    config_url: "url vers le index config",
    game_url: "url vers le latest",
    details: (localConfig, remoteConfig) => ({
      gameBase: {
        valheim: { path: "./", type: "zip", le_reste: "..." },
      },
    }),
  },
];
