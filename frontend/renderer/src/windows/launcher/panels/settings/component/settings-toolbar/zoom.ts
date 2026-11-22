/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Niveau de zoom des réglages (fonctions pures, testées) et sa sauvegarde dans le navigateur.
 */

export const MIN_ZOOM = 0.7;
export const MAX_ZOOM = 1.6;
export const ZOOM_STEP = 0.1;
const STORAGE_KEY = "settings-zoom";

/** Zoom borné et arrondi à 5 % (évite 1.0999999 après plusieurs pas). */
export const clampZoom = (value: number): number => {
  if (!Number.isFinite(value)) return 1;
  const bounded = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
  return Math.round(bounded * 20) / 20;
};

export const loadZoom = (): number => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw === null ? 1 : clampZoom(Number(raw));
  } catch {
    return 1;
  }
};

export const saveZoom = (zoom: number): void => {
  try {
    window.localStorage.setItem(STORAGE_KEY, String(zoom));
  } catch {
    /* stockage indisponible : le zoom reste valable pour la session */
  }
};
