/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Installation en deux temps : les providers téléchargent et extraient d'abord dans un
 * dossier de préparation (`.tmp/<entrée>.stage`), puis `commitStaged` bascule les fichiers
 * prêts dans le dossier de l'entrée par de simples renommages (même disque : instantané).
 * Une coupure ou une erreur pendant la préparation ne touche donc jamais l'installation.
 */

import fs from "fs";
import path from "path";

const moveFile = (source: string, destination: string): void => {
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.rmSync(destination, { recursive: true, force: true });
  try {
    fs.renameSync(source, destination);
  } catch (error) {
    // Autre disque (EXDEV) ou fichier verrouillé : copie puis suppression de la source
    if ((error as NodeJS.ErrnoException).code === "ENOENT") throw error;
    fs.copyFileSync(source, destination);
    fs.rmSync(source, { force: true });
  }
};

/** Chemins relatifs (séparateur `/`) de tous les fichiers sous `directory`. */
const listFiles = (directory: string, prefix = ""): string[] =>
  fs.readdirSync(directory, { withFileTypes: true }).flatMap((item) => {
    const relative = prefix === "" ? item.name : `${prefix}/${item.name}`;
    return item.isDirectory() ? listFiles(path.join(directory, item.name), relative) : [relative];
  });

/** Déplace tous les fichiers de `stageDir` vers `destDir` (écrase) puis supprime `stageDir`. */
export const commitStaged = (
  stageDir: string,
  destDir: string,
  onFile?: (relative: string, destination: string) => void,
): void => {
  if (!fs.existsSync(stageDir)) return;
  for (const relative of listFiles(stageDir)) {
    const destination = path.join(destDir, ...relative.split("/"));
    moveFile(path.join(stageDir, ...relative.split("/")), destination);
    onFile?.(relative, destination);
  }
  fs.rmSync(stageDir, { recursive: true, force: true });
};

/** Déplace un fichier prêt vers le dossier de préparation. */
export const stageFile = (source: string, stageDir: string, relative: string): void =>
  moveFile(source, path.join(stageDir, ...relative.split("/")));
