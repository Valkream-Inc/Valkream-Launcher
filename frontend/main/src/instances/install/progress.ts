/**
 * @author Valkream Team
 * @license MIT-NC
 */

import { formatBytes } from "../../lib/format-bytes";
import type { TransferProgress } from "./providers/types";

/** Progression formatée pour l'affichage (octets traités / total, débit moyen depuis `startedAt`). */
export const progressOf = (processed: number, total: number, startedAt: number): TransferProgress => {
  const seconds = Math.max((Date.now() - startedAt) / 1000, 0.001);
  return {
    processedBytes: formatBytes(processed),
    totalBytes: formatBytes(total),
    percent: total > 0 ? Math.min(100, Math.round((processed / total) * 100)) : 0,
    speed: formatBytes(processed / seconds),
  };
};
