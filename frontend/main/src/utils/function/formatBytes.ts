/**
 * @author Valkream Team
 * @license MIT-NC
 */

const formatBytes = (bytes) => {
  // au sens de nodejjs un bytes = un octet
  const sizes = ["o", "Ko", "Mo", "Go", "To"];
  if (bytes === 0) return "0 o";
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(1) + " " + sizes[i];
};

module.exports = { formatBytes };
