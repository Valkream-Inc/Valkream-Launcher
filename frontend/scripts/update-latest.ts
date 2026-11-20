/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Met à jour le champ `hash` d'une entrée d'un latest.yml en conservant les commentaires
 * et la mise en forme (utilisé par build-manifest --latest).
 */

import { parseDocument } from "yaml";

/** `entry` = `<niveau>.<nom>` (ex : `game-base.valheim`). Lève si l'entrée n'existe pas. */
export const setEntryHash = (yamlText: string, entry: string, hash: string): string => {
  const [tier, name, ...rest] = entry.split(".");
  if (!tier || !name || rest.length > 0) {
    throw new Error(`entrée invalide : « ${entry} » (format <niveau>.<nom>, ex : game-base.valheim)`);
  }

  const document = parseDocument(yamlText);
  if (!document.hasIn([tier, name])) {
    throw new Error(`entrée introuvable dans le latest.yml : ${tier}.${name}`);
  }
  document.setIn([tier, name, "hash"], hash);
  return document.toString({ lineWidth: 0 });
};
