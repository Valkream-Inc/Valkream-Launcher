/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Contexte de résolution des variantes d'un fichier de config pour le joueur : le canal affiché, sa plateforme
 * et la langue du launcher (lue à chaque appel : un changement de langue s'applique sans retélécharger).
 */

import type { Channel, GamePlatform } from "@shared/types";

import { getErrorLanguage } from "../../lib/errors/localized-error.js";
import type { VariantContext } from "./variants.js";

export const variantContext = (channel: Channel, platform: GamePlatform): VariantContext => ({
  channel,
  platform,
  language: getErrorLanguage(),
});
