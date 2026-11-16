/**
 * @author Valkream Team
 * @license MIT-NC
 */

import path from "path";

const isFolderPathSecured = (
  folderToCheck: string,
  autorizedRootPath: string,
  isAnAutorizedSubFolder: (relativePath: string) => boolean | void = () => {}
): boolean => {
  const sanitizedFolder =
    folderToCheck.startsWith("/") || folderToCheck.startsWith("\\")
      ? folderToCheck.slice(1)
      : folderToCheck;

  const fullPath = path.resolve(autorizedRootPath, sanitizedFolder); // Chemin absolu final
  const relativePath = path.relative(autorizedRootPath, fullPath);
  const normalizedRelativePath = path.posix.normalize(
    relativePath.replace(/\\/g, "/")
  );

  const isSafe = fullPath.startsWith(autorizedRootPath);
  const isAutorized = isAnAutorizedSubFolder(normalizedRelativePath);

  return isSafe && Boolean(isAutorized);
};

export default isFolderPathSecured;
