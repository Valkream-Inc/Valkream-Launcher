/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Installation en flux d'une archive `.tar.gz` : téléchargement → gunzip → tar → fichiers,
 * en un seul passage (aucune archive intermédiaire sur le disque).
 */

import { createHash } from "crypto";
import fs from "fs";
import path from "path";
import { pipeline, Readable, Transform } from "stream";
import zlib from "zlib";

import { isNetworkError } from "../../../lib/net/download-file.js";
import { HttpError, httpGet } from "../../../lib/net/http.js";
import { isPathInside } from "../../../lib/fs/paths.js";
import { normalizeRelative } from "../../../lib/format/patterns.js";
import { extractTar } from "../../../lib/archive/tar-extract.js";
import { progressOf } from "../state/progress.js";
import type { InstallIO, TransferProgress } from "../providers/types.js";
import { LocalizedError } from "../../../lib/errors/localized-error.js";

const STREAM_STALL_MS = 30_000;
const STREAM_ATTEMPTS = 3;

export const streamExtractTarGz: InstallIO["streamExtract"] = async (url, outDir, { folderInZip, accept, expectedHash }, signal, onProgress) => {
  const root = path.resolve(outDir);
  const prefix = folderInZip ? normalizeRelative(folderInZip) : "";

  for (let attempt = 1; ; attempt++) {
    fs.rmSync(root, { recursive: true, force: true }); // pas de reprise : on repart d'un dossier vide
    fs.mkdirSync(root, { recursive: true });
    try {
      await streamTarGz(url, root, prefix, accept, signal, onProgress, expectedHash);
      return;
    } catch (error) {
      if (error instanceof LocalizedError) {
        fs.rmSync(root, { recursive: true, force: true }); // hash invalide : rien de l'archive ne reste
        if (error.key === "err.zipHashInvalid") throw error;
      }
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
  expectedHash?: string,
): Promise<void> => {
  const response = await httpGet(url, { timeout: 10_000, headers: { "Accept-Encoding": "identity" }, signal });
  if (!response.body) throw new LocalizedError("err.noBody", { url });
  const total = parseInt(response.headers.get("content-length") ?? "0", 10);
  const startedAt = Date.now();
  let received = 0;

  const source = Readable.fromWeb(response.body as Parameters<typeof Readable.fromWeb>[0]);
  let stall: NodeJS.Timeout | undefined;
  const arm = () => {
    clearTimeout(stall);
    stall = setTimeout(
      () => source.destroy(Object.assign(new LocalizedError("err.stall", { ms: STREAM_STALL_MS }), { code: "ETIMEDOUT" })),
      STREAM_STALL_MS,
    );
  };
  const hash = expectedHash === undefined ? undefined : createHash("sha256");
  const counter = new Transform({
    transform(chunk: Buffer, _encoding, done) {
      arm();
      hash?.update(chunk);
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
    if (hash !== undefined && expectedHash !== undefined) {
      // Le tar peut finir avant les derniers octets du flux : on les lit jusqu'au bout avant de conclure
      if (!gunzip.readableEnded) {
        await new Promise<void>((resolve, reject) => {
          gunzip.once("end", resolve).once("error", reject);
          gunzip.resume();
        });
      }
      const actual = hash.digest("hex");
      if (actual.toLowerCase() !== expectedHash.toLowerCase()) {
        throw new LocalizedError("err.zipHashInvalid", { name: path.basename(url.split(/[?#]/)[0]), expected: expectedHash.slice(0, 12), actual: actual.slice(0, 12) });
      }
    }
    onProgress?.(progressOf(received, received, startedAt));
  } finally {
    clearTimeout(stall);
    signal?.removeEventListener("abort", onAbort);
    source.destroy();
  }
};
