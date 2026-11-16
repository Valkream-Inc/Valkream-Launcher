/**
 * @author Valkream Team
 * @license MIT-NC
 */

import axios from "axios";
import type { AxiosResponse } from "axios";
import fs from "fs";
import path from "path";
import type { Readable } from "stream";
import progress from "progress-stream";
import { Throttle } from "stream-throttle";

import type {
  FileProgressCallback,
  NetworkErrorLike,
} from "../../types/utils";

import { formatBytes } from "./formatBytes";
import { consoleStreamAnswer } from "./consoleStreamAnswer";

const REQUEST_TIMEOUT = 10 * 1000;
const MAX_OTHER_RETRIES = 5;

const NETWORK_ERROR_CODES = new Set([
  "ECONNRESET",
  "ETIMEDOUT",
  "EPIPE",
  "ENOTFOUND",
  "ECONNREFUSED",
  "ECONNABORTED",
  "ENETUNREACH",
  "EAI_AGAIN",
  "ERR_NETWORK",
]);

const isNetworkError = (err: unknown): boolean => {
  if (!err) return false;
  const error = err as NetworkErrorLike;
  if (NETWORK_ERROR_CODES.has(error.code as string)) return true;
  if (error.message === "Network Error") return true;
  if (error.request && !error.response) return true;
  return false;
};

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

const getExistingFileSize = async (destPath: string): Promise<number> => {
  try {
    const stat = await fs.promises.stat(destPath);
    return stat.isFile() ? stat.size : 0;
  } catch {
    return 0;
  }
};

const removePartialFile = async (destPath: string): Promise<void> => {
  try {
    await fs.promises.unlink(destPath);
  } catch {}
};

const parseTotalSizeFromContentRange = (
  contentRange: string | undefined,
  fallback: number
): number => {
  const match = contentRange?.match(/bytes \d+-\d+\/(\d+|\*)/);
  if (!match || match[1] === "*") return fallback;
  return parseInt(match[1], 10);
};

const downloadAxios = axios.create();

const attemptDownload = (
  downloadUrl: string,
  destPath: string,
  callback: FileProgressCallback,
  signal?: AbortSignal
): Promise<void> => {
  return new Promise<void>(async (resolve, reject) => {
    let writer: fs.WriteStream | undefined;
    let response: AxiosResponse<Readable> | undefined;

    // Gestionnaire d'annulation d'urgence
    const onAbort = () => {
      cleanup();
      reject(new Error(`Download aborted for ${downloadUrl}`));
    };

    const cleanup = () => {
      if (response && response.data) response.data.destroy();
      if (writer) writer.destroy(); // 🔑 Libère instantanément le descripteur de fichier (pas de lock)
      signal?.removeEventListener("abort", onAbort);
    };

    if (signal?.aborted) {
      return onAbort();
    }

    signal?.addEventListener("abort", onAbort);

    try {
      await fs.promises.mkdir(path.dirname(destPath), { recursive: true });
      let existingSize = await getExistingFileSize(destPath);

      while (true) {
        if (signal?.aborted) throw new Error("Aborted");

        const headers: Record<string, string> = { "Accept-Encoding": "identity" };
        if (existingSize > 0) {
          headers.Range = `bytes=${existingSize}-`;
        }

        response = await downloadAxios<Readable>({
          url: downloadUrl,
          method: "GET",
          responseType: "stream",
          timeout: REQUEST_TIMEOUT,
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
          headers,
          signal, // Axios coupe automatiquement sa propre requête si le signal trigger
          validateStatus: (status) =>
            status === 200 || status === 206 || status === 416,
        });

        if (existingSize > 0 && response.status === 416) {
          cleanup();
          callback(existingSize, existingSize, 100, 0);
          resolve();
          return;
        }

        if (existingSize > 0 && response.status === 200) {
          response.data.destroy();
          await removePartialFile(destPath);
          callback(0, 0, 0, 0);
          existingSize = 0;
          continue;
        }

        const remainingSize = parseInt(
          response.headers["content-length"] || "0",
          10,
        );
        const totalSize =
          response.status === 206
            ? parseTotalSizeFromContentRange(
                response.headers["content-range"],
                existingSize + remainingSize,
              )
            : remainingSize;
        const downloadedOffset = existingSize;

        const progressStream = progress({
          length: remainingSize || undefined,
          time: 100,
        });

        progressStream.on("progress", (p) => {
          const transferred = downloadedOffset + p.transferred;
          const percent =
            totalSize > 0
              ? Math.round((transferred / totalSize) * 100)
              : Math.round(p.percentage);
          callback(transferred, totalSize, percent, p.speed);
        });

        writer = fs.createWriteStream(destPath, {
          flags: downloadedOffset > 0 ? "a" : "w",
        });

        response.data
          .pipe(new Throttle({ rate: 1024 * 1024 * 1024 }))
          .pipe(progressStream)
          .pipe(writer);

        writer.on("finish", () => {
          cleanup();
          resolve();
        });

        writer.on("error", (err) => {
          cleanup();
          reject(err);
        });

        response.data.on("error", (err) => {
          cleanup();
          reject(err);
        });
        return;
      }
    } catch (err) {
      cleanup();
      reject(err);
    }
  });
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
  signal?: AbortSignal, // 👈 Ajouté aux arguments
): Promise<void> => {
  let otherRetryCount = 0;

  while (true) {
    if (signal?.aborted) {
      throw new Error(
        `Download aborted before starting retry for ${downloadUrl}`,
      );
    }

    try {
      return await attemptDownload(downloadUrl, destPath, callback, signal);
    } catch (err) {
      const { message, code } = err as NetworkErrorLike;

      // Si l'erreur provient d'une annulation volontaire, on ne fait PAS de retry
      if (signal?.aborted /*|| err.message?.includes("aborted")*/) {
        throw err;
      }

      if (isNetworkError(err)) {
        console.log(
          `⚠️  Erreur réseau -> ${message || code} pour ${downloadUrl}, reprise...`,
          message || code,
        );
        await sleep(1000); // Léger délai pour éviter de spammer en boucle fermée
        continue;
      }

      if (otherRetryCount < MAX_OTHER_RETRIES) {
        otherRetryCount++;
        const delay = otherRetryCount * 1000;
        console.log(
          `⚠️  Tentative ${otherRetryCount}/${MAX_OTHER_RETRIES} -> ${message || code} pour ${downloadUrl}...`,
        );
        await removePartialFile(destPath);
        callback(0, 0, 0, 0);
        await sleep(delay);
        continue;
      }

      throw err;
    }
  }
};

export { downloadFile, isNetworkError, REQUEST_TIMEOUT };
