/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Progression GLOBALE d'une entrée composée de plusieurs unités (fichiers d'un manifeste, mods
 * Thunderstore) : un seul pourcentage pour l'ensemble, sans nom de fichier, avec le cumul des
 * octets et le débit moyen. Les unités peuvent progresser en parallèle.
 */

import { formatBytes } from "../../../lib/format-bytes";
import type { TransferProgress } from "./types";

export interface GlobalProgress {
  /** Avancement d'une unité en cours : `fraction` entre 0 et 1, `bytes` déjà traités. */
  update(key: string, fraction: number, bytes?: number): void;
  /** Unité terminée. */
  finish(key: string, bytes?: number): void;
  /** Unité déjà prête (rien à faire) : compte comme terminée. */
  skip(): void;
  /** Émet l'état courant même sans changement. */
  emit(): void;
}

/** `total` peut grandir (dépendances Thunderstore découvertes en route). */
export const createGlobalProgress = (
  report: (progress: TransferProgress) => void,
  total: () => number,
): GlobalProgress => {
  const startedAt = Date.now();
  const inflight = new Map<string, { fraction: number; bytes: number }>();
  let done = 0;
  let doneBytes = 0;
  let shown = 0; // le pourcentage ne recule jamais (le total peut grandir)

  const emit = () => {
    const units = Math.max(total(), 1);
    let progress = done;
    let bytes = doneBytes;
    for (const unit of inflight.values()) {
      progress += unit.fraction;
      bytes += unit.bytes;
    }
    const seconds = Math.max((Date.now() - startedAt) / 1000, 0.001);
    report({
      processedBytes: formatBytes(bytes),
      totalBytes: "",
      percent: (shown = Math.max(shown, Math.min(100, Math.floor((progress / units) * 100)))),
      speed: formatBytes(bytes / seconds),
      processed: bytes,
    });
  };

  return {
    update: (key, fraction, bytes = 0) => {
      inflight.set(key, { fraction: Math.min(Math.max(fraction, 0), 1), bytes });
      emit();
    },
    finish: (key, bytes) => {
      const last = inflight.get(key);
      inflight.delete(key);
      done++;
      doneBytes += bytes ?? last?.bytes ?? 0;
      emit();
    },
    skip: () => {
      done++;
      emit();
    },
    emit,
  };
};
