/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Téléchargement d'un fichier avec `fetch` : reprise (Range + If-Range, voir download-resume),
 * progression, reprise automatique sur coupure réseau, retries limités sur les autres erreurs
 * et garde-fou d'inactivité (un flux qui n'envoie plus rien est coupé puis repris).
 */

import fs from "fs";
import path from "path";
import { Readable, Transform } from "stream";
import { pipeline } from "stream/promises";

import type { FileProgressCallback, NetworkErrorLike } from "../types/utils";

import { completePartial, discardPartial, rememberPartial, resumePoint, validatorOf } from "./download-resume";
import { consoleStreamAnswer } from "./console-stream";
import { formatBytes } from "./format-bytes";
import { HttpError, httpGet } from "./http";

const REQUEST_TIMEOUT = 10 * 1000;
const STALL_TIMEOUT = 30 * 1000;
const MAX_OTHER_RETRIES = 5;
const PROGRESS_INTERVAL = 100;

const NETWORK_ERROR_CODES = new Set([
  "ECONNRESET",
  "ETIMEDOUT",
  "EPIPE",
  "ENOTFOUND",
  "ECONNREFUSED",
  "ECONNABORTED",
  "ENETUNREACH",
  "EAI_AGAIN",
  "UND_ERR_SOCKET",
  "UND_ERR_CONNECT_TIMEOUT",
  "UND_ERR_HEADERS_TIMEOUT",
  "UND_ERR_BODY_TIMEOUT",
]);

export interface DownloadOptions {
  /** Inactivité maximale du flux avant coupure (ms). */
  stallTimeoutMs?: number;
  /** Multiplicateur des délais entre deux tentatives (ms, défaut 1000). */
  retryDelayMs?: number;
}

export const isNetworkError = (err: unknown): boolean => {
  if (!err) return false;
  const error = err as NetworkErrorLike;
  if (NETWORK_ERROR_CODES.has(error.code as string)) return true;
  if (NETWORK_ERROR_CODES.has(error.cause?.code as string)) return true;
  // `fetch` signale toute coupure de connexion par « TypeError: fetch failed »
  return error.name === "TypeError" && error.message === "fetch failed";
};

/** Erreur HTTP définitive (4xx hors 408 / 429) : inutile de réessayer. */
const isFatalHttpError = (err: unknown): boolean =>
  err instanceof HttpError && err.status >= 400 && err.status < 500 && err.status !== 408 && err.status !== 429;

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const parseTotalSizeFromContentRange = (contentRange: string | null, fallback: number): number => {
  const match = contentRange?.match(/bytes \d+-\d+\/(\d+|\*)/);
  if (!match || match[1] === "*") return fallback;
  return parseInt(match[1], 10);
};

const attemptDownload = async (
  downloadUrl: string,
  destPath: string,
  callback: FileProgressCallback,
  signal: AbortSignal | undefined,
  stallTimeoutMs: number,
): Promise<void> => {
  await fs.promises.mkdir(path.dirname(destPath), { recursive: true });

  // Reprise d'un partiel (même URL, fichier distant inchangé) ; sinon on repart de zéro.
  let { offset: existingSize, validator } = resumePoint(destPath, downloadUrl);

  while (true) {
    if (signal?.aborted) throw new Error(`Download aborted for ${downloadUrl}`);

    const headers: Record<string, string> = { "Accept-Encoding": "identity" };
    if (existingSize > 0) {
      headers.Range = `bytes=${existingSize}-`;
      if (validator) headers["If-Range"] = validator; // fichier changé : le serveur renvoie 200 (tout)
    }

    const response = await httpGet(downloadUrl, {
      timeout: REQUEST_TIMEOUT,
      headers,
      signal,
      accept: (status) => status === 200 || status === 206 || status === 416,
    });

    // Déjà complet : rien à télécharger
    if (existingSize > 0 && response.status === 416) {
      callback(existingSize, existingSize, 100, 0);
      return;
    }

    // Le serveur ignore Range ou le fichier a changé : on repart de zéro
    if (existingSize > 0 && response.status === 200) {
      void response.body?.cancel();
      discardPartial(destPath);
      callback(0, 0, 0, 0);
      existingSize = 0;
      validator = undefined;
      continue;
    }

    if (!response.body) throw new Error(`Réponse sans contenu pour ${downloadUrl}`);
    rememberPartial(destPath, downloadUrl, validatorOf(Object.fromEntries(response.headers)));

    const remainingSize = parseInt(response.headers.get("content-length") ?? "0", 10);
    const totalSize =
      response.status === 206
        ? parseTotalSizeFromContentRange(response.headers.get("content-range"), existingSize + remainingSize)
        : remainingSize;

    const source = Readable.fromWeb(response.body as Parameters<typeof Readable.fromWeb>[0]);
    const writer = fs.createWriteStream(destPath, { flags: existingSize > 0 ? "a" : "w" });

    let transferred = existingSize;
    let lastReport = Date.now();
    let lastBytes = existingSize;

    // Garde-fou : plus aucun octet reçu depuis `stallTimeoutMs` → coupure (la reprise est automatique)
    let stallTimer: NodeJS.Timeout | undefined;
    const armStall = () => {
      clearTimeout(stallTimer);
      stallTimer = setTimeout(
        () => source.destroy(Object.assign(new Error(`Aucune donnée reçue depuis ${stallTimeoutMs} ms`), { code: "ETIMEDOUT" })),
        stallTimeoutMs,
      );
    };

    const counter = new Transform({
      transform(chunk: Buffer, _encoding, done) {
        armStall();
        transferred += chunk.length;
        const now = Date.now();
        if (now - lastReport >= PROGRESS_INTERVAL) {
          const speed = ((transferred - lastBytes) * 1000) / (now - lastReport);
          const percent = totalSize > 0 ? Math.round((transferred / totalSize) * 100) : 0;
          void callback(transferred, totalSize, percent, speed);
          lastReport = now;
          lastBytes = transferred;
        }
        done(null, chunk);
      },
    });

    const onAbort = () => source.destroy(new Error(`Download aborted for ${downloadUrl}`));
    signal?.addEventListener("abort", onAbort, { once: true });
    armStall();
    try {
      await pipeline(source, counter, writer);
      void callback(transferred, totalSize || transferred, 100, 0);
    } finally {
      clearTimeout(stallTimer);
      signal?.removeEventListener("abort", onAbort);
    }
    return;
  }
};

const downloadFile = async (
  downloadUrl: string,
  destPath: string,
  callback: FileProgressCallback = (downloadedBytes, totalBytes, percent, speed) =>
    consoleStreamAnswer(
      `📥 Téléchargement du fichier ${path.basename(destPath)} : ${percent}% ` +
        `(${formatBytes(downloadedBytes)} / ${formatBytes(totalBytes)}) ` +
        `à ${formatBytes(speed)}/s`,
    ),
  signal?: AbortSignal,
  { stallTimeoutMs = STALL_TIMEOUT, retryDelayMs = 1000 }: DownloadOptions = {},
): Promise<void> => {
  let otherRetryCount = 0;

  while (true) {
    if (signal?.aborted) throw new Error(`Download aborted before starting retry for ${downloadUrl}`);

    try {
      await attemptDownload(downloadUrl, destPath, callback, signal, stallTimeoutMs);
      completePartial(destPath);
      return;
    } catch (err) {
      const { message, code } = err as NetworkErrorLike;

      // Annulation volontaire (ou erreur définitive) : pas de retry
      if (signal?.aborted || isFatalHttpError(err)) throw err;

      // Coupure réseau : on reprend là où on s'est arrêté, sans limite (l'utilisateur peut annuler)
      if (isNetworkError(err)) {
        console.log(`⚠️  Erreur réseau -> ${message || code} pour ${downloadUrl}, reprise...`);
        await sleep(retryDelayMs);
        continue;
      }

      if (otherRetryCount < MAX_OTHER_RETRIES) {
        otherRetryCount++;
        console.log(`⚠️  Tentative ${otherRetryCount}/${MAX_OTHER_RETRIES} -> ${message || code} pour ${downloadUrl}...`);
        discardPartial(destPath);
        callback(0, 0, 0, 0);
        await sleep(otherRetryCount * retryDelayMs);
        continue;
      }

      throw err;
    }
  }
};

export { downloadFile, REQUEST_TIMEOUT };
