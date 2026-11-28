/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Lecture d'un fichier de configuration : YAML ou JSON, détecté par l'extension du nom ou du lien
 * (`.yml` / `.yaml` → YAML, `.json` → JSON ; autre ou absente → JSON puis YAML). Tous les fichiers de
 * config (index, latest, listes de mods, événement…) passent par ici : le format est libre, par fichier.
 */

export type DataFormat = "json" | "yaml" | "auto";

/** Format d'après l'extension (requête et ancre d'un lien ignorées). */
export const formatOf = (nameOrUrl: string): DataFormat => {
  const path = nameOrUrl.split(/[?#]/, 1)[0].toLowerCase();
  if (path.endsWith(".yml") || path.endsWith(".yaml")) return "yaml";
  if (path.endsWith(".json")) return "json";
  return "auto";
};

const parseYaml = async (text: string): Promise<unknown> => {
  // Chargé à la demande : seuls les fichiers YAML en ont besoin
  const { default: yaml } = await import("yaml");
  return yaml.parse(text);
};

export const parseData = async (text: string, nameOrUrl: string): Promise<unknown> => {
  const format = formatOf(nameOrUrl);
  if (format === "yaml") return parseYaml(text);
  if (format === "json") return JSON.parse(text);
  try {
    return JSON.parse(text);
  } catch {
    return parseYaml(text);
  }
};

/** Version synchrone pour les fichiers JSON locaux ; une extension YAML doit passer par `parseData`. */
export const parseJsonData = (text: string): unknown => JSON.parse(text);
