/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Cache disque des paramètres remote : un fichier par clé (URL).
 */

import crypto from "crypto";
import fs from "fs";
import path from "path";

import type { ParamCache } from "./ParamResolver";

const fileFor = (dir: string, key: string): string =>
  path.join(dir, crypto.createHash("sha1").update(key).digest("hex") + ".cache");

export const createDiskCache = (dir: string): ParamCache => ({
  async read(key) {
    try {
      return await fs.promises.readFile(fileFor(dir, key), "utf8");
    } catch {
      return null;
    }
  },

  async write(key, content) {
    await fs.promises.mkdir(dir, { recursive: true });
    await fs.promises.writeFile(fileFor(dir, key), content, "utf8");
  },
});
