/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Niveau de zoom des réglages (bornes testées) et sa sauvegarde dans les réglages du launcher.
 */

export const MIN_ZOOM = 0.7;
export const MAX_ZOOM = 1.6;
export const ZOOM_STEP = 0.1;

/** Zoom borné et arrondi à 5 % (évite 1.0999999 après plusieurs pas). */
export const clampZoom = (value: number): number => {
  if (!Number.isFinite(value)) return 1;
  const bounded = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
  return Math.round(bounded * 20) / 20;
};

const LEGACY_KEY = "settings-zoom";

/** Zoom enregistré dans les réglages du launcher (reprend l'ancienne valeur du navigateur la première fois). */
export const loadZoom = async (): Promise<number> => {
  try {
    const saved = clampZoom(Number(await window.electron_API.getSettings("settingsZoom")));
    if (saved !== 1) return saved;
    const legacy = window.localStorage.getItem(LEGACY_KEY);
    if (legacy === null) return 1;
    const migrated = clampZoom(Number(legacy));
    window.localStorage.removeItem(LEGACY_KEY);
    if (migrated !== 1) await window.electron_API.setSettings("settingsZoom", migrated);
    return migrated;
  } catch {
    return 1;
  }
};

let saveTimer: ReturnType<typeof setTimeout> | undefined;

/** Enregistre le zoom dans les réglages (regroupé : Ctrl + molette envoie beaucoup d'événements). */
export const saveZoom = (zoom: number): void => {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    void window.electron_API.setSettings("settingsZoom", zoom).catch(() => {
      /* réglage non enregistré : le zoom reste valable pour la session */
    });
  }, 300);
};
