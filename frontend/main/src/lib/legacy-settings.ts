/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Reprise des réglages de l'ancienne base SQLite (`databases/Databases.db`, table `configClient`,
 * une ligne JSON). Le module natif `better-sqlite3` est optionnel : absent ou base illisible =
 * pas de reprise (les réglages par défaut s'appliquent). À supprimer quelques versions plus tard.
 */

import fs from "fs";
import path from "path";

interface LegacyDatabase {
  prepare(sql: string): { get(key: number): { json_data?: string } | undefined };
  close(): void;
}

export type LegacyOpener = (file: string) => Promise<LegacyDatabase>;

const openWithBetterSqlite: LegacyOpener = async (file) => {
  const module = (await import("better-sqlite3")) as unknown as {
    default: new (file: string, options: { readonly: boolean; fileMustExist: boolean }) => LegacyDatabase;
  };
  return new module.default(file, { readonly: true, fileMustExist: true });
};

export const readLegacySettings = async <T extends object>(
  databasesDir: string,
  fileName: string,
  open: LegacyOpener = openWithBetterSqlite,
): Promise<Partial<T> | undefined> => {
  const file = path.join(databasesDir, fileName);
  if (!fs.existsSync(file)) return undefined;
  try {
    const db = await open(file);
    try {
      const row = db.prepare("SELECT json_data FROM configClient WHERE id=?").get(1);
      const parsed: unknown = row?.json_data ? JSON.parse(row.json_data) : undefined;
      if (typeof parsed !== "object" || parsed === null) return undefined;
      const { ID: _id, ...settings } = parsed as Record<string, unknown>;
      return settings as Partial<T>;
    } finally {
      db.close();
    }
  } catch {
    return undefined;
  }
};
