/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Config render d'une instance : tout ce qui ne concerne que l'affichage.
 * Aucune URL de téléchargement ni chemin disque ici (ils vivent dans le remote).
 */

import type { ReactNode } from "react";

import type { InstanceId } from "@shared/types";

import type { GltfGameData } from "../windows/launcher/component/background/gltf-background/gltf-background.types";

/**
 * Visibilité d'un réglage dans l'onglet Game :
 * - `normal` : toujours visible ;
 * - `special` : options spéciales activées (ctrl + shift + clic sur le logo) ;
 * - `danger` : idem, rangé sous « Danger zone ».
 */
export type SettingLevel = "normal" | "special" | "danger";

/** Réglage propre à une instance, rendu par le composant de réglages générique. */
export type CustomGameSetting =
  | {
      type: "toggle";
      /** Nom du réglage, stocké par instance. Une entrée `optional.setting` du latest.yml s'y rattache. */
      settingsName: string;
      label: string;
      /** Texte d'aide affiché au-dessus du réglage. */
      text?: string;
      level?: SettingLevel;
      default?: boolean;
    }
  | {
      type: "select";
      settingsName: string;
      label: string;
      text?: string;
      level?: SettingLevel;
      options: { value: string; label: string }[];
      default?: string;
    };

/** Tableau de l'onglet Debug : rattaché à une entrée du latest.yml par son nom. */
export interface DebugContent {
  entry: string;
  title?: string;
}

export interface InstanceRenderConfig {
  /** Même `id` que la config main et l'index remote. */
  id: InstanceId;
  /** Nom affiché dans le choix du jeu. */
  name: string;
  /** Image affichée dans le choix du jeu. */
  icon?: string;
  /** Préfixe des fichiers `public/` du jeu (`./images/<assets>-background.png`, `./models/<assets>-3d.glb`…). */
  assets: string;
  /** Nom court affiché sur l'accueil à côté du nombre de joueurs. */
  serverLabel?: string;
  /** Réglages de la scène 3D (fond « 3d »). */
  gltf: GltfGameData;
  /** Contenu de la popup « Astuces du jour ». */
  tipContent?: ReactNode;
  /** Contenu de la popup de bienvenue avant la première installation. */
  welcomeContent?: ReactNode;
  /** Présentation affichée dans l'onglet General. */
  descriptionContent?: ReactNode;
  links?: { discord?: string; topserver?: string; site?: string };
  customGamesSettings?: CustomGameSetting[];
  debugContent?: DebugContent[];
}
