/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

const formatBytes = (bytes) => {
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  if (bytes === 0) return "0 B";
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(1) + " " + sizes[i];
};

module.exports = { formatBytes };
