/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Reprise d'un téléchargement interrompu (annulation, coupure, redémarrage du launcher).
 * À côté de chaque fichier partiel, `<fichier>.meta` retient l'URL et le validateur HTTP
 * (ETag ou Last-Modified) de la réponse : le téléchargement reprend (en-têtes Range +
 * If-Range) seulement si c'est la même URL et que le fichier distant n'a pas changé.
 * Sans validateur, seule une reprise dans la même exécution du launcher est permise.
 */

import fs from "fs";

interface PartialMeta {
  url: string;
  validator?: string;
}

const metaPath = (destPath: string): string => `${destPath}.meta`;

/** Fichiers partiels créés ou poursuivis par cette exécution (reprise permise sans validateur). */
const livePartials = new Set<string>();

const removeQuietly = (file: string): void => fs.rmSync(file, { force: true });

/** Oublie le fichier partiel et ses métadonnées. */
export const discardPartial = (destPath: string): void => {
  removeQuietly(destPath);
  removeQuietly(metaPath(destPath));
  livePartials.delete(destPath);
};

/** Le téléchargement est terminé : les métadonnées de reprise ne servent plus. */
export const completePartial = (destPath: string): void => {
  removeQuietly(metaPath(destPath));
  livePartials.delete(destPath);
};

/** Enregistre ce qui permettra de reprendre `destPath` (appelé à chaque réponse reçue). */
export const rememberPartial = (destPath: string, url: string, validator?: string): void => {
  livePartials.add(destPath);
  const meta: PartialMeta = { url, ...(validator ? { validator } : {}) };
  try {
    fs.writeFileSync(metaPath(destPath), JSON.stringify(meta));
  } catch {
    // reprise facultative
  }
};

/**
 * Octets déjà téléchargés et réutilisables (0 = repartir de zéro, le fichier partiel est alors supprimé)
 * et validateur à envoyer dans `If-Range`.
 */
export const resumePoint = (destPath: string, url: string): { offset: number; validator?: string } => {
  let size = 0;
  try {
    const stat = fs.statSync(destPath);
    size = stat.isFile() ? stat.size : 0;
  } catch {
    return { offset: 0 };
  }
  if (size === 0) return { offset: 0 };

  let meta: PartialMeta | undefined;
  try {
    meta = JSON.parse(fs.readFileSync(metaPath(destPath), "utf8")) as PartialMeta;
  } catch {
    meta = undefined;
  }

  const sameUrl = meta?.url === url;
  const allowed = sameUrl && (meta?.validator !== undefined || livePartials.has(destPath));
  if (!allowed) {
    discardPartial(destPath);
    return { offset: 0 };
  }
  return { offset: size, validator: meta?.validator };
};

/** Validateur HTTP d'une réponse : ETag fort, sinon Last-Modified. */
export const validatorOf = (headers: Record<string, unknown>): string | undefined => {
  const etag = headers.etag;
  if (typeof etag === "string" && !etag.startsWith("W/")) return etag;
  const lastModified = headers["last-modified"];
  return typeof lastModified === "string" ? lastModified : undefined;
};
