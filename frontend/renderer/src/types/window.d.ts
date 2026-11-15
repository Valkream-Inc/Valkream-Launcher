/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * APIs exposées par le preload (`contextBridge.exposeInMainWorld`).
 * `electron_API` est celle de la fenêtre principale OU de la fenêtre de mise à jour
 * selon la fenêtre chargée : on expose donc l'union des deux contrats.
 */

import type {
  ElectronAPI,
  ElectronSevenDtoDAPI,
  ElectronUpdaterAPI,
  ElectronValheimAPI,
} from "@shared/types";

declare global {
  interface Window {
    electron_API: ElectronAPI & ElectronUpdaterAPI;
    electron_Valheim_API: ElectronValheimAPI;
    electron_SevenDtoD_API: ElectronSevenDtoDAPI;
  }
}

export {};
