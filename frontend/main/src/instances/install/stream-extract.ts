/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Installation en flux d'une archive `.tar.gz` : téléchargement → gunzip → tar → fichiers,
 * en un seul passage (aucune archive intermédiaire sur le disque).
 */

import fs from "fs";
import path from "path";
import { pipeline, Readable, Transform } from "stream";
import zlib from "zlib";

import { isNetworkError } from "../../lib/download-file.js";
import { HttpError, httpGet } from "../../lib/http.js";
import { isPathInside } from "../../lib/paths.js";
import { normalizeRelative } from "../../lib/patterns.js";
import { extractTar } from "../../lib/tar-extract.js";
import { progressOf } from "./progress.js";
import type { InstallIO, TransferProgress } from "./providers/types.js";

const STREAM_STALL_MS = 30_000;
const STREAM_ATTEMPTS = 3;

export const streamExtractTarGz: InstallIO["streamExtract"] = async (url, outDir, { folderInZip, accept }, signal, onProgress) => {
  const root = path.resolve(outDir);
  const prefix = folderInZip ? normalizeRelative(folderInZip) : "";

  for (let attempt = 1; ; attempt++) {
    fs.rmSync(root, { recursive: true, force: true }); // pas de reprise : on repart d'un dossier vide
    fs.mkdirSync(root, { recursive: true });
    try {
      await streamTarGz(url, root, prefix, accept, signal, onProgress);
      return;
    } catch (error) {
      const retryable = isNetworkError(error) || (error instanceof HttpError && error.status >= 500);
      if (signal?.aborted || !retryable || attempt >= STREAM_ATTEMPTS) throw error;
      console.log(`⚠️  Flux interrompu (${(error as Error).message}), nouvelle tentative ${attempt + 1}/${STREAM_ATTEMPTS}...`);
      await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
    }
  }
};

/** Une tentative : téléchargement → gunzip → tar → fichiers, en un seul flux. */
const streamTarGz = async (
  url: string,
  root: string,
  prefix: string,
  accept: (relativePath: string) => boolean,
  signal: AbortSignal | undefined,
  onProgress: ((progress: TransferProgress) => void) | undefined,
): Promise<void> => {
  const response = await httpGet(url, { timeout: 10_000, headers: { "Accept-Encoding": "identity" }, signal });
  if (!response.body) throw new Error(`Réponse sans contenu pour ${url}`);
  const total = parseInt(response.headers.get("content-length") ?? "0", 10);
  const startedAt = Date.now();
  let received = 0;

  const source = Readable.fromWeb(response.body as Parameters<typeof Readable.fromWeb>[0]);
  let stall: NodeJS.Timeout | undefined;
  const arm = () => {
    clearTimeout(stall);
    stall = setTimeout(
      () => source.destroy(Object.assign(new Error(`Aucune donnée reçue depuis ${STREAM_STALL_MS} ms`), { code: "ETIMEDOUT" })),
      STREAM_STALL_MS,
    );
  };
  const counter = new Transform({
    transform(chunk: Buffer, _encoding, done) {
      arm();
      received += chunk.length;
      onProgress?.(progressOf(received, total, startedAt));
      done(null, chunk);
    },
  });
  const gunzip = zlib.createGunzip();
  const onAbort = () => source.destroy(new Error(`Download aborted for ${url}`));
  signal?.addEventListener("abort", onAbort, { once: true });
  arm();
  pipeline(source, counter, gunzip, () => {}); // une erreur en amont fait échouer la lecture ci-dessous

  try {
    await extractTar(gunzip, {
      onFile: ({ path: archivePath }) => {
        let relative = normalizeRelative(archivePath);
        if (prefix !== "") {
          if (relative !== prefix && !relative.startsWith(prefix + "/")) return null;
          relative = relative.slice(prefix.length + 1);
        }
        if (relative === "" || !accept(relative)) return null;
        const fullPath = path.resolve(root, relative);
        if (!isPathInside(root, fullPath)) {
          console.warn(`⚠️ Chemin ignoré (hors destination) : ${archivePath}`);
          return null;
        }
        fs.mkdirSync(path.dirname(fullPath), { recursive: true });
        return fs.createWriteStream(fullPath);
      },
      onSkipped: (archivePath, type) => console.warn(`⚠️ Entrée tar ignorée (type ${type}) : ${archivePath}`),
    });
    onProgress?.(progressOf(received, received, startedAt));
  } finally {
    clearTimeout(stall);
    signal?.removeEventListener("abort", onAbort);
    source.destroy();
  }
};
