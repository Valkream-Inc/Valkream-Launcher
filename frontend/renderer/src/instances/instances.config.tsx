/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Config render de chaque instance.
 * Le main reste la source de vérité de la liste des instances (`getInstances()`) :
 * une entrée ici sans instance main correspondante n'est pas affichée.
 * Ajouter un jeu = une entrée ici (+ une côté main et une dans l'index remote).
 */

import { lazy } from "react";
import { useTranslation } from "react-i18next";

import type { InstanceRenderConfig } from "./instances.types";

// Chargé à la demande avec le fond 3D (three.js n'est pas dans le bundle de démarrage)
const SunsetEnvironment = lazy(
  () => import("../windows/launcher/component/background/gltf-background/component/sunset-environement"),
);

const DISCORD = "https://discord.com/invite/zn3TsumtyG";
const SITE = "https://valkream.com";

const TipsMessage = () => {
  const { t } = useTranslation();
  return (
    <>
      {t("settings.content.tips1")}
      <br />
      <br />
      {t("settings.content.tips2")}
    </>
  );
};

const WelcomeMessage = () => {
  const { t } = useTranslation();
  return (
    <>
      {t("settings.content.welcome1")}
      <br />
      <br />
      {t("settings.content.welcome2")}
    </>
  );
};

const instancesRenderConfig: InstanceRenderConfig[] = [
  {
    id: "Valheim-Valkream-v2",
    name: "Valheim v2",
    images: {
      icon: "./images/Valheim-icon.png",
      iconWithName: "./images/Valheim-icon-with-name.png",
      name: "./images/Valheim-name.png",
    },
    background: {
      image: "./images/Valheim-background.png",
      video: "./videos/Valheim-trailer.mp4",
      audio: "./audios/Valheim-song.mp3",
      model: "./models/Valheim-3d.glb",
      scene: {
        camera: { position: [0, 1.8, 4.5], fov: 75 },
        lights: { ambientIntensity: 0.4, color: "#ffffff" },
        fogArgs: ["#202030", 0, 50],
        environment: <SunsetEnvironment />,
        hasCampfire: true,
      },
    },
    serverLabel: "Valheim",
    links: {
      discord: DISCORD,
      site: SITE,
      topserver: "https://top-serveurs.net/Valheim/vote/Valheim-valkream",
    },
    tipContent: <TipsMessage />,
    welcomeContent: <WelcomeMessage />,
    description: ["d1", "d2", "d3", "d4", "d5"],
    // Textes du jeu : ajouter une langue ou un texte = une ligne ici (clés locales à l'instance).
    translations: {
      fr: {
        d1: "Le partage et l'entraide sont des mots clés qui définissent bien l'esprit de la communauté Valkream.",
        d2: "Le respect de l'idéologie des développeurs originaux est une priorité.",
        d3: "Le mode pack est essentiellement constitué de mécaniques additionnelles, de nouvelles créatures, d'armures, d'armes et tous les biomes sont fonctionnels.",
        d4: "Le mode pack Valkream est jouable en partie privée, serveur privé ou serveur Valkream.",
        d5: "Garantissant une expérience complète et sans fin.",
        "boostFps.label": "Mods boost FPS",
        "boostFps.text":
          "Installer les mods qui améliorent les performances (dégrade grandement les graphismes) ?",
        "boostGraphic.label": "Mods boost graphismes",
        "boostGraphic.text":
          "Installer les mods qui améliorent les graphismes (demande un PC performant) ?",
        "modsAdmin.label": "Mods admin",
        "modsAdmin.text":
          "Installer les mods d'administration (réservé aux admins du serveur).",
      },
      en: {
        d1: "Sharing and mutual help are key words that describe the spirit of the Valkream community well.",
        d2: "Respecting the original developers' vision is a priority.",
        d3: "The modpack mainly consists of additional mechanics, new creatures, armors, weapons, and all biomes are functional.",
        d4: "The Valkream modpack can be played in a private game, a private server or the Valkream server.",
        d5: "Guaranteeing a complete and endless experience.",
        "boostFps.label": "FPS boost mods",
        "boostFps.text":
          "Install the mods that improve performance (greatly degrades graphics)?",
        "boostGraphic.label": "Graphics boost mods",
        "boostGraphic.text":
          "Install the mods that improve graphics (requires a powerful PC)?",
        "modsAdmin.label": "Admin mods",
        "modsAdmin.text":
          "Install the administration mods (reserved for server admins).",
      },
    },
    // Réglages Game propres à Valheim (label / text : clé de `translations` de l'instance, ou `{ fr, en }` en ligne, ou texte brut). (launchSteam et launcherBehavior sont génériques).
    customGamesSettings: [
      {
        type: "toggle",
        settingsName: "boostFps",
        label: "boostFps.label",
        text: "boostFps.text",
      },
      {
        type: "toggle",
        settingsName: "boostGraphic",
        label: "boostGraphic.label",
        text: "boostGraphic.text",
        category: { level: "admin" },
      },
      {
        type: "toggle",
        settingsName: "modsAdmin",
        label: "modsAdmin.label",
        text: "modsAdmin.text",
        category: { level: "admin", zone: "danger" },
      },
    ],
    debugContent: [
      { entry: "valheim" },
      { entry: "bepinex" },
      { entry: "mods-thunderstore" },
      { entry: "mods-admin" },
      { entry: "mods-boostfps" },
      { entry: "mods-boostgraphic" },
      { entry: "configs" },
    ],
  },
  {
    id: "SevenDtoD-Valkream-v2",
    name: "7 Days to Die v2",
    images: {
      icon: "./images/SevenDtoD-icon.png",
      iconWithName: "./images/SevenDtoD-icon-with-name.png",
      name: "./images/SevenDtoD-name.png",
    },
    background: {
      image: "./images/SevenDtoD-background.png",
      video: "./videos/SevenDtoD-trailer.mp4",
      audio: "./audios/SevenDtoD-song.mp3",
      model: "./models/SevenDtoD-3d.glb",
      scene: {
        camera: { position: [60, 60, 60], fov: 75 },
        lights: { ambientIntensity: 30, color: "#ffffff" },
        fogArgs: ["#202030", 0, 200],
        environment: null,
        hasCampfire: false,
      },
    },
    serverLabel: "7 Days",
    links: {
      discord: DISCORD,
      site: SITE,
      topserver:
        "https://top-serveurs.net/7-days-to-die/vote/7-days-to-valkream",
    },
    tipContent: <TipsMessage />,
    welcomeContent: <WelcomeMessage />,
    description: ["d1", "d2", "d3", "d4", "d5"],
    // Textes du jeu : ajouter une langue ou un texte = une ligne ici (clés locales à l'instance).
    translations: {
      fr: {
        d1: "Le partage et l'entraide sont des mots clés qui définissent bien l'esprit de la communauté Valkream.",
        d2: "Le développement est assuré par des bénévoles sur leur temps personnel. Le respect de l'idéologie des développeurs originaux est une priorité.",
        d3: "Le modpack 7days to Valkream est essentiellement constitué de mécaniques additionnelles, de nouvelles créatures, d'armures, d'armes et tous les biomes sont fonctionnels.",
        d4: "La difficulté est aussi augmentée et évolutive, garantissant une expérience plus difficile, complète et sans fin.",
        d5: "Pour y accéder, connectez-vous au serveur Valkream. Via votre Steam ou via notre Launcher.",
      },
      en: {
        d1: "Sharing and mutual help are key words that describe the spirit of the Valkream community well.",
        d2: "Development is carried out by volunteers in their spare time. Respecting the original developers' vision is a priority.",
        d3: "The 7days to Valkream modpack mainly consists of additional mechanics, new creatures, armors, weapons, and all biomes are functional.",
        d4: "Difficulty is also increased and evolving, guaranteeing a harder, more complete and endless experience.",
        d5: "To access it, connect to the Valkream server, through your Steam or through our Launcher.",
      },
    },
    debugContent: [{ entry: "sevendtod" }, { entry: "modpack" }],
  },
];

export default instancesRenderConfig;
