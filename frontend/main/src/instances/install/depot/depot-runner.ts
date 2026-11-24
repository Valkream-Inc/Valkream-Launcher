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
export type DepotRunner = (command: string, args: string[], options: DepotRunOptions) => Promise<number>;

/** `NN.NN% fichier` → pourcentage. */
export const parseDepotPercent = (line: string): number | undefined => {
  const match = /^\s*(\d{1,3}(?:[.,]\d+)?)%/.exec(line);
  if (!match) return undefined;
  const value = parseFloat(match[1].replace(",", "."));
  return value >= 0 && value <= 100 ? value : undefined;
};

export const realDepotRunner: DepotRunner = (command, args, { cwd, signal, onLine }) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, stdio: ["ignore", "pipe", "pipe"], windowsHide: true, signal });
    let pending = "";
    // Un décodeur par flux : un caractère multi-octets (blocs ▀▄█ du QR code) peut être coupé entre deux morceaux
    const feeder = () => {
      const decoder = new StringDecoder("utf8");
      return (chunk: Buffer) => feed(decoder.write(chunk));
    };
    const feed = (text: string) => {
      pending += text;
      const lines = pending.split(/\r\n|\n|\r/);
      pending = lines.pop() ?? "";
      for (const line of lines) if (line !== "") onLine(line);
    };
    child.stdout.on("data", feeder());
    child.stderr.on("data", feeder());
    child.once("error", reject);
    child.once("close", (code) => {
      if (pending !== "") onLine(pending);
      resolve(code ?? -1);
    });
  });
