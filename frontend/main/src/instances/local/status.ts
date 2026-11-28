/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Statut d'une installation pour l'accueil : déduit du rapport et de la connexion.
 * Module pur.
 */

import type { InstanceReport, InstanceStatus } from "@shared/types";

export interface Connectivity {
  isInternetConnected: boolean;
  isServerReachable: boolean;
}

const isBase = (entry: InstanceReport["entries"][number]): boolean => entry.tier === "game-base";

export const computeStatus = (
  report: InstanceReport,
  connectivity: Connectivity,
): InstanceStatus => {
  const { summary } = report;
  const isConnected = connectivity.isInternetConnected && connectivity.isServerReachable;
  const bases = report.entries.filter((entry) => isBase(entry) && entry.status !== "skipped");

  // Sans remote lisible (hors ligne, pas de cache), on se fie à l'état enregistré sur le disque.
  const knowsRemote = report.entries.length > 0;
  const isInstalled = knowsRemote
    ? bases.every((entry) => entry.status !== "not-installed") && summary.notInstalled < summary.total
    : report.installedCount > 0;

  const isMajorUpdate = bases.some((entry) => entry.status === "outdated" || entry.status === "modified");
  const isUpToDate = knowsRemote
    ? summary.invalid === 0 &&
      summary.outdated === 0 &&
      summary.notInstalled === 0 &&
      summary.modified === 0
    : false;

  const activeOptionalSettings = report.entries
    .filter((entry) => entry.optionalSetting !== undefined && entry.status !== "skipped")
    .map((entry) => entry.optionalSetting as string);

  return {
    ...connectivity,
    isInstalled,
    isUpToDate,
    isMajorUpdate,
    gameVersion: report.releaseVersion || null,
    activeOptionalSettings: [...new Set(activeOptionalSettings)],
    // Connecté : seulement si tout ce qui bloque est à jour. Hors ligne : on joue ce qui est installé.
    canPlay: isInstalled && (isConnected ? summary.blocking.length === 0 && summary.invalid === 0 : true),
    errors: report.errors,
  };
};
