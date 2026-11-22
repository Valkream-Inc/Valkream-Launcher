/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Config render de chaque instance.
 * Le main reste la source de vérité de la liste des instances (`getInstances()`) :
 * une entrée ici sans instance main correspondante n'est pas affichée.
 * Ajouter un jeu = une entrée ici (+ une côté main et une dans l'index remote).
 */

import { useTranslation } from "react-i18next";

import SunsetEnvironment from "../windows/launcher/component/background/gltf-background/component/sunset-environement";
import type { InstanceRenderConfig } from "./instances.types";

const DISCORD = "https://discord.com/invite/zn3TsumtyG";
const SITE = "https://valkream.com";

const TipsMessage = () => {
  const { t } = useTranslation();
  return (
    <>
      {t("content.tips1")}
      <br />
      <br />
      {t("content.tips2")}
    </>
  );
};

const WelcomeMessage = () => {
  const { t } = useTranslation();
  return (
    <>
      {t("content.welcome1")}
      <br />
      <br />
      {t("content.welcome2")}
    </>
  );
};

/** Liste de paragraphes traduits (`content.<jeu>.d1…dN`). */
const Description = ({ game, count }: { game: string; count: number }) => {
  const { t } = useTranslation();
  return (
    <ul>
      {Array.from({ length: count }, (_, index) => (
        <li key={index}>{t(`content.${game}.d${index + 1}`)}</li>
      ))}
    </ul>
  );
};

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
    descriptionContent: <Description game="valheim" count={5} />,
    // Réglages Game propres à Valheim (label / text : clés de traduction ; un texte brut reste accepté). (launchSteam et launcherBehavior sont génériques).
    customGamesSettings: [
      {
        type: "toggle",
        settingsName: "boostFps",
        label: "content.valheim.boostFps.label",
        text: "content.valheim.boostFps.text",
      },
      {
        type: "toggle",
        settingsName: "boostGraphic",
        label: "content.valheim.boostGraphic.label",
        text: "content.valheim.boostGraphic.text",
        category: { level: "admin" },
      },
      {
        type: "toggle",
        settingsName: "modsAdmin",
        label: "content.valheim.modsAdmin.label",
        text: "content.valheim.modsAdmin.text",
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
    links: {
      discord: DISCORD,
      site: SITE,
      topserver:
        "https://top-serveurs.net/7-days-to-die/vote/7-days-to-valkream",
    },
    tipContent: <TipsMessage />,
    welcomeContent: <WelcomeMessage />,
    descriptionContent: <Description game="sevenDays" count={5} />,
    debugContent: [{ entry: "sevendtod" }, { entry: "modpack" }],
  },
];

export default instancesRenderConfig;
