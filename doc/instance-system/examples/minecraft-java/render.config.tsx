// À ajouter dans frontend/renderer/src/instances/instances.config.tsx (même id que la config main)
{
  id: "Minecraft-Example",
  name: "Minecraft (exemple)",
  images: { icon: "…", iconWithName: "…", name: "…" },     // imports depuis renderer/src/assets
  background: { image: "…", video: "…", audio: "…", model: "…", scene: {} as never },
  serverLabel: "Minecraft",
  description: ["d1"],
  translations: {
    fr: { d1: "Serveur Minecraft Valkream : Java inclus, rien à installer.", "ram.label": "Mémoire maximale", "aikar.label": "Options JVM optimisées", "aikar.text": "Active les options G1GC recommandées pour les serveurs." },
    en: { d1: "Valkream Minecraft server: Java included, nothing to install.", "ram.label": "Maximum memory", "aikar.label": "Optimized JVM flags", "aikar.text": "Enables the G1GC flags recommended for servers." },
  },
  customGamesSettings: [
    { type: "slider", settingsName: "ram", label: "ram.label", min: 1024, max: 16384, step: 512, unit: "Mo", default: 4096 },
    { type: "toggle", settingsName: "aikarFlags", label: "aikar.label", text: "aikar.text" },
  ],
},
