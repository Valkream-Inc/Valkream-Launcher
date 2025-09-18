/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

const path = require("path");

const isFolderPathSecured = (
  folderToCheck,
  autorizedRootPath,
  isAnAutorizedSubFolder = (relativePath) => {}
) => {
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

  return isSafe && isAutorized;
};

module.exports = isFolderPathSecured;
