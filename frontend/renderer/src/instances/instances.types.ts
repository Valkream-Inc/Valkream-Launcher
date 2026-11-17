/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Config render d'une instance : tout ce qui ne concerne que l'affichage.
 * Aucune URL de téléchargement ni chemin disque ici (ils vivent dans le remote).
 */

import type { ReactNode } from "react";

import type { InstanceId } from "@shared/types";

/** Réglage propre à une instance, rendu par le composant de réglages générique. */
export type CustomGameSetting =
  | {
      type: "toggle";
      /** Nom du réglage, stocké par instance. Une entrée `optional.setting` du latest.yml s'y rattache. */
      settingsName: string;
      label: string;
      default?: boolean;
    }
  | {
      type: "select";
      settingsName: string;
      label: string;
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
  tipContent?: ReactNode;
  descriptionContent?: ReactNode;
  links?: { discord?: string; topserver?: string; site?: string };
  customGamesSettings?: CustomGameSetting[];
  debugContent?: DebugContent[];
}
