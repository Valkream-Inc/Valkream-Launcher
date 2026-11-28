/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Exécution de DepotDownloader : tableau d'arguments (jamais de shell), stdin fermé (le launcher
 * ne transmet aucun mot de passe : la connexion se fait par QR code), sortie lue ligne à ligne.
 */

import { spawn } from "child_process";
import { StringDecoder } from "string_decoder";

export interface DepotRunOptions {
  cwd: string;
  signal?: AbortSignal;
  onLine: (line: string) => void;
}

/** Retourne le code de sortie. Injectable pour les tests. */
export type DepotRunner = (
  command: string,
  args: string[],
  options: DepotRunOptions,
) => Promise<number>;

/** `NN.NN% fichier` → pourcentage. */
export const parseDepotPercent = (line: string): number | undefined => {
  const match = /^\s*(\d{1,3}(?:[.,]\d+)?)%/.exec(line);
  if (!match) return undefined;
  const value = parseFloat(match[1].replace(",", "."));
  return value >= 0 && value <= 100 ? value : undefined;
};

/**
 * Table de correspondance des caractères de blocs CP437 / CP850 (0x80–0xFF)
 * vers Unicode, avec repli en latin1 pour le reste des octets hauts.
 */
const OEM_BLOCK_MAP: Record<number, string> = {
  0xb0: "░",
  0xb1: "▒",
  0xb2: "▓",
  0xdb: "█",
  0xdc: "▄",
  0xdd: "▌",
  0xde: "▐",
  0xdf: "▀",
  0xfe: "■",
};

const decodeWin32Chunk = (chunk: Buffer): string => {
  let out = "";
  for (let i = 0; i < chunk.length; i++) {
    const byte = chunk[i];
    if (byte < 0x80) {
      out += String.fromCharCode(byte);
    } else {
      out += OEM_BLOCK_MAP[byte] ?? chunk.subarray(i, i + 1).toString("latin1");
    }
  }
  return out;
};

export const realDepotRunner: DepotRunner = (
  command,
  args,
  { cwd, signal, onLine },
) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
      signal,
    });

    const createStreamFeeder = () => {
      const utf8Decoder = new StringDecoder("utf8");
      let pending = "";

      const feed = (text: string) => {
        pending += text;
        const lines = pending.split(/\r\n|\n|\r/);
        pending = lines.pop() ?? "";
        for (const line of lines) {
          if (line !== "") onLine(line);
        }
      };

      const onData = (chunk: Buffer) => {
        if (process.platform === "win32") {
          feed(decodeWin32Chunk(chunk));
        } else {
          feed(utf8Decoder.write(chunk));
        }
      };

      const flush = () => {
        if (process.platform !== "win32") {
          const tail = utf8Decoder.end();
          if (tail) feed(tail);
        }
        if (pending !== "") onLine(pending);
        pending = "";
      };

      return { onData, flush };
    };

    const stdoutFeeder = createStreamFeeder();
    const stderrFeeder = createStreamFeeder();

    child.stdout.on("data", stdoutFeeder.onData);
    child.stderr.on("data", stderrFeeder.onData);

    child.once("error", reject);
    child.once("close", (code) => {
      stdoutFeeder.flush();
      stderrFeeder.flush();
      resolve(code ?? -1);
    });
  });
