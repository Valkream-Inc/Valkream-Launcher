/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Met à jour le champ `hash` d'une entrée d'un fichier latest en conservant, pour un YAML, les commentaires
 * et la mise en forme (utilisé par build-manifest --latest). Format détecté par l'extension : `.json` ou YAML.
 */

import { parseDocument } from "yaml";

/** `entry` = `<niveau>.<nom>` (ex : `game-base.valheim`). Lève si l'entrée n'existe pas. */
export const setEntryHash = (text: string, entry: string, hash: string, fileName = "latest.yml"): string => {
  const [tier, name, ...rest] = entry.split(".");
  if (!tier || !name || rest.length > 0) {
    throw new Error(`entrée invalide : « ${entry} » (format <niveau>.<nom>, ex : game-base.valheim)`);
  }

  if (fileName.toLowerCase().endsWith(".json")) {
    const data = JSON.parse(text) as Record<string, Record<string, Record<string, unknown> | undefined> | undefined>;
    const target = data[tier]?.[name];
    if (!target) throw new Error(`entrée introuvable dans ${fileName} : ${tier}.${name}`);
    target.hash = hash;
    return `${JSON.stringify(data, null, 2)}\n`;
  }

  const document = parseDocument(text);
  if (!document.hasIn([tier, name])) {
    throw new Error(`entrée introuvable dans ${fileName} : ${tier}.${name}`);
  }
  document.setIn([tier, name, "hash"], hash);
  return document.toString({ lineWidth: 0 });
};
