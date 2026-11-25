/**
 * @author Valkream Team
 * @license MIT-NC
 */

const formatBytes = (bytes: number): string => {
  // au sens de nodejjs un bytes = un octet
  const sizes = ["o", "Ko", "Mo", "Go", "To"];
  if (!(bytes > 0)) return "0 o";
  // Même plage que l'interface (o → To) ; en dessous d'1 octet ou au-delà du To, l'unité extrême
  const i = Math.min(Math.max(Math.floor(Math.log(bytes) / Math.log(1024)), 0), sizes.length - 1);
  return (bytes / Math.pow(1024, i)).toFixed(1) + " " + sizes[i];
};

export { formatBytes };
