/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Config render de chaque instance.
 * Le main reste la source de vérité de la liste des instances (`getInstances()`) :
 * une entrée ici sans instance main correspondante n'est pas affichée.
 * Ajouter un jeu = une entrée ici (+ une côté main et une dans l'index remote).
 */

import SunsetEnvironment from "../windows/launcher/component/background/gltf-background/component/sunset-environement";
import type { InstanceRenderConfig } from "./instances.types";

const DISCORD = "https://discord.com/invite/zn3TsumtyG";
const SITE = "https://valkream.com";

const TipsMessage = () => (
  <>
    Lorsque vous êtes en jeu, soyez connecté sur le serveur Mumble et dans le
    canal « Vocal en jeu » du serveur Discord Valkream.
    <br />
    <br />
    Les informations et actualités sont disponibles sur la page Web et sur le
    serveur Discord. (si vous avez besoin d'aide, n'hésitez pas à nous joindre
    sur notre serveur Discord)
  </>
);

const WelcomeMessage = () => (
  <>
    Vous êtes sur le point d’installer le jeu ...
    <br />
    <br />
    Si vous avez des problèmes, n'hésitez pas à nous joindre sur notre serveur
    Discord.
  </>
);

const instancesRenderConfig: InstanceRenderConfig[] = [
  {
    id: "Valheim-Valkream-v2",
    name: "Valheim",
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
    descriptionContent: (
      <ul>
        <li>
          Le partage et l’entraide sont des mots clés qui définissent bien
          l’esprit de la communauté Valkream.
        </li>
        <br />
        <li>
          Le respect de l’idéologie des développeurs originaux est une priorité.
        </li>
        <br />
        <li>
          Le mode pack est essentiellement constitué de mécaniques
          additionnelles, de nouvelles créatures, d’armures, d’armes et tous les
          biomes sont fonctionnels.
        </li>
        <br />
        <li>
          Le mode pack Valkream est jouable en partie privée, serveur privée ou
          serveur Valkream.
        </li>
        <br />
        <li>Garantissant une expérience complète et sans fin.</li>
        <br />
      </ul>
    ),
    // Réglages Game propres à Valheim (launchSteam et launcherBehavior sont génériques).
    customGamesSettings: [
      {
        type: "toggle",
        settingsName: "boostFps",
        label: "Mods boost FPS",
        text: "Installer les mods qui améliorent les performances ?",
      },
      {
        type: "toggle",
        settingsName: "boostGraphic",
        label: "Mods boost graphismes",
        text: "Installer les mods qui améliorent les graphismes ?",
        level: "special",
      },
      {
        type: "toggle",
        settingsName: "modsAdmin",
        label: "Mods admin",
        text: "Installer les mods d'administration (réservé aux admins du serveur).",
        level: "danger",
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
    name: "7 Days to Die",
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
    links: { discord: DISCORD, site: SITE },
    tipContent: <TipsMessage />,
    welcomeContent: <WelcomeMessage />,
    descriptionContent: (
      <ul>
        <li>
          Le partage et l’entraide sont des mots clés qui définissent bien
          l’esprit de la communauté Valkream.
        </li>
        <br />
        <li>
          Le développement est assuré par des bénévoles sur leur temps
          personnel. Le respect de l’idéologie des développeurs originaux est
          une priorité.
        </li>
        <br />
        <li>
          Le modpack 7days to Valkream est essentiellement constitué de
          mécaniques additionnelles, de nouvelles créatures, d’armures, d’armes
          et tous les biomes sont fonctionnels.
        </li>
        <br />
        <li>
          La difficulté est aussi augmentée et évolutive, garantissant une
          expérience plus difficile, complète et sans fin.
        </li>
        <br />
        <li>
          Pour y accéder, connectez-vous au serveur Valkream. Via votre Steam ou
          via notre Launcher.
        </li>
        <br />
      </ul>
    ),
    debugContent: [{ entry: "sevendtod" }, { entry: "modpack" }],
  },
];

export default instancesRenderConfig;
