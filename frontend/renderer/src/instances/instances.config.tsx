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

import glb_SevenDtoD_3d from "../assets/models/SevenDtoD-3d.glb?url";
import glb_Valheim_3d from "../assets/models/Valheim-3d.glb?url";
import img_SevenDtoD_background from "../assets/images/SevenDtoD-background.png";
import img_SevenDtoD_icon from "../assets/images/SevenDtoD-icon.png";
import img_SevenDtoD_icon_with_name from "../assets/images/SevenDtoD-icon-with-name.png";
import img_SevenDtoD_name from "../assets/images/SevenDtoD-name.png";
import img_Valheim_background from "../assets/images/Valheim-background.png";
import img_Valheim_icon from "../assets/images/Valheim-icon.png";
import img_Valheim_icon_with_name from "../assets/images/Valheim-icon-with-name.png";
import img_Valheim_name from "../assets/images/Valheim-name.png";
import mp3_SevenDtoD_song from "../assets/audios/SevenDtoD-song.mp3";
import mp3_Valheim_song from "../assets/audios/Valheim-song.mp3";
import mp4_SevenDtoD_trailer from "../assets/videos/SevenDtoD-trailer.mp4";
import mp4_Valheim_trailer from "../assets/videos/Valheim-trailer.mp4";
import type { InstanceRenderConfig } from "./instances.types";

// Chargé à la demande avec le fond 3D (three.js n'est pas dans le bundle de démarrage)
const SunsetEnvironment = lazy(
  () =>
    import("../windows/launcher/component/background/gltf-background/component/sunset-environement"),
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

const baseInstances: InstanceRenderConfig[] = [
  {
    id: "Valheim-Valkream-v2",
    name: "Valheim v2",
    images: {
      icon: img_Valheim_icon,
      iconWithName: img_Valheim_icon_with_name,
      name: img_Valheim_name,
    },
    background: {
      image: img_Valheim_background,
      video: mp4_Valheim_trailer,
      audio: mp3_Valheim_song,
      model: glb_Valheim_3d,
      scene: {
        camera: { position: [0, 1.8, 4.5], fov: 75 },
        lights: { ambientIntensity: 0.4, color: "#ffffff" },
        fogArgs: ["#202030", 0, 50],
        environment: <SunsetEnvironment />,
        hasCampfire: true,
      },
    },
    serverLabel: "Valheim v2",
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
      icon: img_SevenDtoD_icon,
      iconWithName: img_SevenDtoD_icon_with_name,
      name: img_SevenDtoD_name,
    },
    background: {
      image: img_SevenDtoD_background,
      video: mp4_SevenDtoD_trailer,
      audio: mp3_SevenDtoD_song,
      model: glb_SevenDtoD_3d,
      scene: {
        camera: { position: [60, 60, 60], fov: 75 },
        lights: { ambientIntensity: 30, color: "#ffffff" },
        fogArgs: ["#202030", 0, 200],
        environment: null,
        hasCampfire: false,
      },
    },
    serverLabel: "7 Days v2",
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

// Valheim v3 : mêmes visuels et textes que la v2 ; seul le réglage « mods admin » existe (pas de boost FPS / graphismes).
const valheimV2 = baseInstances[0];
const instancesRenderConfig: InstanceRenderConfig[] = [
  ...baseInstances,
  {
    ...valheimV2,
    id: "Valheim-Valkream-v3",
    name: "Valheim v3",
    serverLabel: "Valheim v3",
    customGamesSettings: valheimV2.customGamesSettings?.filter((setting) => setting.settingsName === "modsAdmin"),
    debugContent: [
      { entry: "valheim" },
      { entry: "bepinex" },
      { entry: "configs" },
      { entry: "mods-thunderstore" },
      { entry: "mods-hexium" },
      { entry: "mods-admin" },
    ],
  },
];

export default instancesRenderConfig;
