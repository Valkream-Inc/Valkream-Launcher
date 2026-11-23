/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Les liens ouverts dans le navigateur / Steam viennent de configs distantes :
 * seuls http, https et steam sont acceptés, sans identifiants dans l'URL.
 */

const ALLOWED_PROTOCOLS = new Set(["http:", "https:", "steam:"]);

export const isSafeExternalUrl = (url: unknown): url is string => {
  if (typeof url !== "string" || url.length > 2048) return false;
  try {
    const parsed = new URL(url);
    return ALLOWED_PROTOCOLS.has(parsed.protocol) && parsed.username === "" && parsed.password === "";
  } catch {
    return false;
  }
};
