/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Garde-fous contre les archives piégées (zip bomb) : nombre de fichiers et taille
 * décompressée annoncés, vérifiés AVANT toute extraction.
 */

export interface ArchiveLimits {
  maxFiles: number;
  maxBytes: number;
}

export const DEFAULT_ARCHIVE_LIMITS: ArchiveLimits = {
  maxFiles: 200_000,
  maxBytes: 100 * 1024 ** 3, // 100 Go : un jeu moddé reste très en dessous
};

export const assertArchiveWithinLimits = (
  entries: readonly { uncompressedSize: number }[],
  limits: ArchiveLimits = DEFAULT_ARCHIVE_LIMITS,
): void => {
  if (entries.length > limits.maxFiles) {
    throw new Error(`archive refusée : ${entries.length} fichiers (maximum ${limits.maxFiles})`);
  }
  let total = 0;
  for (const { uncompressedSize } of entries) {
    total += uncompressedSize;
    if (total > limits.maxBytes) {
      throw new Error(`archive refusée : taille décompressée supérieure à ${limits.maxBytes} octets`);
    }
  }
};
