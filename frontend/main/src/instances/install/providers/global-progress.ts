/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Progression GLOBALE d'une entrée composée de plusieurs unités (fichiers d'un manifeste, mods
 * Thunderstore) : un seul pourcentage pour l'ensemble, sans nom de fichier, avec le cumul des
 * octets, le total et le débit moyen. Les unités peuvent progresser en parallèle.
 *
 * Quand les tailles sont connues (`expect`), le pourcentage est pondéré par les octets (un fichier de 2 Go
 * pèse plus que dix petits) et le total est affiché. Une unité sans taille connue est estimée à la taille
 * moyenne des autres ; le total est alors précédé de « ~ ». Sans aucune taille : pourcentage par unité.
 */

import { formatBytes } from "../../../lib/format/format-bytes.js";
import type { TransferProgress } from "./types.js";

export interface GlobalProgress {
  /** Taille (octets) d'une unité, connue d'avance ou dès le début de son téléchargement. */
  expect(key: string, bytes: number): void;
  /** Avancement d'une unité en cours : `fraction` entre 0 et 1, `bytes` déjà traités. */
  update(key: string, fraction: number, bytes?: number): void;
  /** Unité terminée. */
  finish(key: string, bytes?: number): void;
  /** Unité déjà prête (rien à faire) : compte comme terminée. `bytes` : sa taille, si connue ; `key` : son identifiant. */
  skip(bytes?: number, key?: string): void;
  /**
   * Fige le total : à appeler une fois les tailles initiales collectées. Ensuite le total affiché ne change plus
   * (une unité de taille inconnue pèse la moyenne figée, même quand sa vraie taille arrive en route).
   */
  lock(): void;
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
  const sizes = new Map<string, number>();
  let done = 0;
  let doneBytes = 0; // octets réellement traités par les unités terminées
  let doneWeight = 0; // poids (octets attendus) des unités terminées, estimés si inconnus
  let doneKnownSizes = 0;
  let doneKnownCount = 0;
  let shown = 0; // le pourcentage ne recule jamais (le total peut grandir)
  let locked = false;
  let lockedAverage = 0;
  let estimatedDone = 0; // unités terminées dont le poids est estimé (total « ~ »)

  const knownSizes = (): number[] => [...sizes.values()];

  const emit = () => {
    const units = Math.max(total(), 1);
    const sizesSeen = knownSizes();
    const knownCount = sizesSeen.length + doneKnownCount;
    const knownSum = sizesSeen.reduce((sum, size) => sum + size, 0) + doneKnownSizes;
    const weighted = knownCount > 0;
    const average = locked ? lockedAverage : weighted ? knownSum / knownCount : 0;

    let progress = done;
    let bytes = doneBytes;
    let processedWeight = doneWeight;
    let totalWeight = doneWeight;
    for (const [key, unit] of inflight) {
      const weight = sizes.get(key) ?? average;
      progress += unit.fraction;
      bytes += unit.bytes;
      processedWeight += unit.fraction * weight;
      totalWeight += weight;
    }
    // Unités pas encore commencées : taille connue (déjà mesurée) sinon taille moyenne
    let notStartedKnown = 0;
    let notStartedKnownCount = 0;
    for (const [key, size] of sizes) {
      if (inflight.has(key)) continue;
      notStartedKnown += size;
      notStartedKnownCount++;
    }
    totalWeight += notStartedKnown;
    const pending = Math.max(units - done - inflight.size - notStartedKnownCount, 0);
    totalWeight += pending * average;

    const fraction = weighted && totalWeight > 0 ? processedWeight / totalWeight : progress / units;
    const exact =
      weighted && pending === 0 && estimatedDone === 0 && [...inflight.keys()].every((key) => sizes.has(key));
    const seconds = Math.max((Date.now() - startedAt) / 1000, 0.001);
    report({
      processedBytes: formatBytes(bytes),
      totalBytes: weighted ? `${exact ? "" : "~"}${formatBytes(totalWeight)}` : "",
      percent: (shown = Math.max(shown, Math.min(100, Math.floor(fraction * 1000) / 10))),
      speed: formatBytes(bytes / seconds),
      processed: bytes,
      ...(weighted ? { total: totalWeight } : {}),
    });
  };

  const settle = (key: string | undefined, bytes: number | undefined): void => {
    const last = key === undefined ? undefined : inflight.get(key);
    const known = key === undefined ? undefined : sizes.get(key);
    if (key !== undefined) {
      inflight.delete(key);
      sizes.delete(key);
    }
    done++;
    const processed = bytes ?? last?.bytes ?? 0;
    doneBytes += processed;
    if (known !== undefined) {
      doneKnownSizes += known;
      doneKnownCount++;
      doneWeight += known;
    } else if (locked) {
      // Total figé : l'unité garde le poids estimé qu'elle avait dans le total
      doneWeight += lockedAverage;
      estimatedDone++;
    } else {
      // Taille inconnue au départ : le poids est ce qui a été réellement traité
      doneWeight += processed;
      estimatedDone++;
      if (processed > 0) {
        doneKnownSizes += processed;
        doneKnownCount++;
      }
    }
  };

  return {
    expect: (key, bytes) => {
      // Total figé : une taille qui arrive en retard ne modifie plus le total
      if (bytes > 0 && !(locked && !sizes.has(key))) sizes.set(key, bytes);
    },
    lock: () => {
      if (locked) return;
      const known = [...sizes.values()];
      const count = known.length + doneKnownCount;
      lockedAverage = count > 0 ? (known.reduce((sum, size) => sum + size, 0) + doneKnownSizes) / count : 0;
      locked = true;
    },
    update: (key, fraction, bytes = 0) => {
      inflight.set(key, { fraction: Math.min(Math.max(fraction, 0), 1), bytes });
      emit();
    },
    finish: (key, bytes) => {
      settle(key, bytes);
      emit();
    },
    skip: (bytes, key) => {
      settle(key, bytes);
      emit();
    },
    emit,
  };
};
