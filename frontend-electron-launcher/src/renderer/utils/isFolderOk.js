/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

const path = require("path");

const isFolderOk = (
  basePath,
  folderToCheck,
  autorizedSubFolder = (relativePath) => {}
) => {
  const sanitizedFolder =
    folderToCheck.startsWith("/") || folderToCheck.startsWith("\\")
      ? folderToCheck.slice(1)
      : folderToCheck;

  const fullPath = path.resolve(basePath, sanitizedFolder); // Chemin absolu final
  const relativePath = path.relative(basePath, fullPath);
  const normalizedRelativePath = path.posix.normalize(
    relativePath.replace(/\\/g, "/")
  );

  const isSafe = fullPath.startsWith(basePath);
  const isAutorized = autorizedSubFolder(normalizedRelativePath);

  return isSafe && isAutorized;
};

module.exports = isFolderOk;
