/**
 * @author Valkream Team
 * @license MIT-NC
 */

import path from "path";

import { isPathInside } from "../engine/paths";

const isFolderPathSecured = (
  folderToCheck: string,
  autorizedRootPath: string,
  isAnAutorizedSubFolder: (relativePath: string) => boolean | void = () => {}
): boolean => {
  const sanitizedFolder = folderToCheck.replace(/^[/\\]+/, "");

  const fullPath = path.resolve(autorizedRootPath, sanitizedFolder); // Chemin absolu final
  const relativePath = path.relative(autorizedRootPath, fullPath);
  const normalizedRelativePath = path.posix.normalize(
    relativePath.replace(/\\/g, "/")
  );

  // Comparaison par chemin relatif : "/data/game2" n'est pas dans "/data/game".
  const isSafe = isPathInside(autorizedRootPath, fullPath);
  const isAutorized = isAnAutorizedSubFolder(normalizedRelativePath);

  return isSafe && Boolean(isAutorized);
};

export default isFolderPathSecured;
