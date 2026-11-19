/**
 * @author Valkream Team
 * @license MIT-NC
 */

import DatabaseLib from "better-sqlite3";
import fs from "fs";
import path from "path";

import type { DatabaseRecord, DatabaseRow } from "../types/utils";

import { isDev } from "../core/constants";
import DirsManager from "../core/dirs";

class Database {
  db: DatabaseLib.Database;

  constructor() {
    const dbPath = path.join(DirsManager.dbPath(), "databases");
    if (!fs.existsSync(dbPath)) fs.mkdirSync(dbPath, { recursive: true });
    const fileName = isDev ? "Databases.sqlite" : "Databases.db";
    this.db = new DatabaseLib(path.join(dbPath, fileName));
  }

  createTable(tableName: string): void {
    this.db
      .prepare(
        `CREATE TABLE IF NOT EXISTS ${tableName} (id INTEGER PRIMARY KEY, json_data TEXT)`
      )
      .run();
  }

  createData<T extends object>(
    tableName: string,
    data: T
  ): T & { ID: number | bigint } {
    this.createTable(tableName);
    const stmt = this.db.prepare(
      `INSERT INTO ${tableName} (json_data) VALUES (?)`
    );
    const info = stmt.run(JSON.stringify(data));
    return { ...data, ID: info.lastInsertRowid };
  }

  readData<T extends object = Record<string, unknown>>(
    tableName: string,
    key: number = 1
  ): DatabaseRecord<T> | undefined {
    this.createTable(tableName);
    const row = this.db
      .prepare(`SELECT * FROM ${tableName} WHERE id=?`)
      .get(key) as DatabaseRow | undefined;
    if (!row) return undefined;
    return { ...JSON.parse(row.json_data), ID: row.id };
  }

  readAllData<T extends object = Record<string, unknown>>(
    tableName: string
  ): DatabaseRecord<T>[] {
    this.createTable(tableName);
    const rows = this.db.prepare(`SELECT * FROM ${tableName}`).all() as DatabaseRow[];
    return rows.map((row) => ({ ...JSON.parse(row.json_data), ID: row.id }));
  }

  updateData<T extends object = Record<string, unknown>>(
    tableName: string,
    data: object,
    key: number = 1
  ): DatabaseRecord<T> | undefined {
    this.createTable(tableName);
    this.db
      .prepare(`UPDATE ${tableName} SET json_data=? WHERE id=?`)
      .run(JSON.stringify(data), key);
    return this.readData<T>(tableName, key);
  }

  deleteData(tableName: string, key: number = 1): DatabaseLib.RunResult {
    this.createTable(tableName);
    return this.db.prepare(`DELETE FROM ${tableName} WHERE id=?`).run(key);
  }
}

export default Database;
