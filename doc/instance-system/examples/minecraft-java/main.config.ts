// À ajouter dans frontend/main/src/instances/instances.config.ts
{
  id: "Minecraft-Example",
  server: { type: "minecraft", host: "mc.example.com", port: 25565, timeout: 2000 },
  indexUrl: "/games/Minecraft-Example/index.config.json",
  entryPaths: {
    java: "java",            // le JRE téléchargé : instances/<id>/<canal>/java/
    minecraft: "game",
    mods: "game/mods",
  },
  // Pas d'`executable` : le jeu se lance par une commande. Un chemin AVEC séparateur est résolu depuis la racine
  // de l'instance (le Java installé ci-dessus) ; sans séparateur (`java`) ce serait la commande du PATH.
  command: {
    win32: "java/bin/javaw.exe",
    linux: "java/bin/java",
  },
  launchCwd: "game", // dossier de travail du jeu (relatif à l'instance)
  launchArgs: [
    "-Xmx{ram}M",
    { when: "aikarFlags", args: ["-XX:+UseG1GC", "-XX:+ParallelRefProcEnabled"] },
    "-jar", "server.jar", "nogui",
  ],
  defaultSettings: { launchSteam: false, launcherBehavior: "close", ram: 4096, aikarFlags: false },
},
