/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Lecteur tar en flux (ustar, extensions pax `x` et GNU `L`) : les fichiers sont écrits
 * au fil de l'arrivée des octets, sans jamais garder l'archive en entier (ni sur le disque ni en mémoire).
 * Prévu pour un flux `.tar.gz` : téléchargement → gunzip → ce lecteur, en même temps.
 */

import { once } from "events";
import type { Writable } from "stream";

import { DEFAULT_ARCHIVE_LIMITS, type ArchiveLimits } from "./archive-limits.js";

const BLOCK = 512;

export interface TarFileHeader {
  path: string;
  size: number;
}

export interface TarHandlers {
  /** Destination d'un fichier ; `null` = on le saute. Les dossiers ne sont pas présentés. */
  onFile(header: TarFileHeader): Writable | null | Promise<Writable | null>;
  /** Lien ou fichier spécial ignoré. */
  onSkipped?(path: string, type: string): void;
}

const field = (block: Buffer, start: number, length: number): string => {
  const raw = block.subarray(start, start + length);
  const end = raw.indexOf(0);
  return raw.subarray(0, end === -1 ? length : end).toString("utf8");
};

const parseSize = (block: Buffer): number => {
  // Base 256 (tailles > 8 Gio) : bit de poids fort du premier octet
  if (block[124] & 0x80) {
    let value = block[124] & 0x7f;
    for (let i = 125; i < 136; i++) value = value * 256 + block[i];
    return value;
  }
  const size = parseInt(field(block, 124, 12).trim() || "0", 8);
  if (Number.isNaN(size)) throw new Error("archive tar invalide : taille illisible");
  return size;
};

const parsePax = (data: Buffer): Record<string, string> => {
  const result: Record<string, string> = {};
  let offset = 0;
  while (offset < data.length) {
    const space = data.indexOf(0x20, offset);
    if (space === -1) break;
    const length = parseInt(data.subarray(offset, space).toString(), 10);
    if (!length) break;
    const record = data.subarray(space + 1, offset + length - 1).toString("utf8");
    const eq = record.indexOf("=");
    if (eq > 0) result[record.slice(0, eq)] = record.slice(eq + 1);
    offset += length;
  }
  return result;
};

const isZero = (block: Buffer): boolean => block.every((byte) => byte === 0);

const write = async (stream: Writable, chunk: Buffer): Promise<void> => {
  if (!stream.write(chunk)) await once(stream, "drain");
};

const finish = async (stream: Writable): Promise<void> => {
  const done = once(stream, "finish");
  stream.end();
  await done;
};

/** Lit l'archive tar du flux `source` et écrit chaque fichier via `handlers`. */
export const extractTar = async (
  source: AsyncIterable<Buffer>,
  handlers: TarHandlers,
  limits: ArchiveLimits = DEFAULT_ARCHIVE_LIMITS,
): Promise<{ files: number; bytes: number }> => {
  let header = Buffer.alloc(0); // octets d'en-tête en attente
  let remaining = 0; // octets de contenu restants du fichier en cours
  let padding = 0; // octets de remplissage à sauter après le contenu
  let current: { stream: Writable | null } | undefined;
  let meta: { type: string; path: string; chunks: Buffer[] } | undefined; // contenu pax / GNU à lire entièrement
  let nextPath: string | undefined; // chemin imposé par une extension
  let files = 0;
  let bytes = 0;

  const startEntry = async (block: Buffer): Promise<void> => {
    const type = String.fromCharCode(block[156] || 0x30);
    const size = parseSize(block);
    const prefix = field(block, 345, 155);
    let name = field(block, 0, 100);
    if (prefix && field(block, 257, 5) === "ustar") name = `${prefix}/${name}`;
    if (nextPath !== undefined) {
      name = nextPath;
      nextPath = undefined;
    }

    if (type === "x" || type === "g" || type === "L") {
      meta = { type, path: name, chunks: [] };
      remaining = size;
      padding = (BLOCK - (size % BLOCK)) % BLOCK;
      return;
    }

    if (type === "5") return; // dossier : créé à la demande par les fichiers
    if (type !== "0") {
      handlers.onSkipped?.(name, type); // liens, périphériques… jamais suivis
      remaining = size;
      padding = (BLOCK - (size % BLOCK)) % BLOCK;
      current = { stream: null };
      return;
    }

    if (++files > limits.maxFiles) throw new Error(`archive refusée : plus de ${limits.maxFiles} fichiers`);
    bytes += size;
    if (bytes > limits.maxBytes) throw new Error(`archive refusée : taille décompressée supérieure à ${limits.maxBytes} octets`);

    current = { stream: await handlers.onFile({ path: name, size }) };
    remaining = size;
    padding = (BLOCK - (size % BLOCK)) % BLOCK;
    if (size === 0 && current.stream) await finish(current.stream);
    if (size === 0) current = undefined;
  };

  const endBody = async (): Promise<void> => {
    if (meta) {
      const data = Buffer.concat(meta.chunks);
      if (meta.type === "L") nextPath = field(data, 0, data.length);
      else if (meta.type === "x") {
        const pax = parsePax(data);
        if (pax.path) nextPath = pax.path;
      }
      meta = undefined;
    } else if (current) {
      if (current.stream) await finish(current.stream);
      current = undefined;
    }
  };

  try {
    for await (let chunk of source) {
      while (chunk.length > 0) {
        if (remaining > 0) {
          const part = chunk.subarray(0, remaining);
          if (meta) meta.chunks.push(part);
          else if (current?.stream) await write(current.stream, part);
          remaining -= part.length;
          chunk = chunk.subarray(part.length);
          if (remaining === 0) {
            await endBody();
            if (padding === 0) continue;
          }
          continue;
        }
        if (padding > 0) {
          const skipped = Math.min(padding, chunk.length);
          padding -= skipped;
          chunk = chunk.subarray(skipped);
          continue;
        }

        const needed = BLOCK - header.length;
        const take = chunk.subarray(0, needed);
        header = header.length ? Buffer.concat([header, take]) : Buffer.from(take);
        chunk = chunk.subarray(take.length);
        if (header.length < BLOCK) continue;

        const block = header;
        header = Buffer.alloc(0);
        if (isZero(block)) continue; // fin d'archive (deux blocs nuls)
        await startEntry(block);
        if (remaining === 0 && meta) await endBody();
      }
    }
  } catch (error) {
    if (current?.stream) current.stream.destroy();
    throw error;
  }

  if (remaining > 0 || header.length > 0) throw new Error("archive tar tronquée");
  return { files, bytes };
};
