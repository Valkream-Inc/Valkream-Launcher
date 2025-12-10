/**
 * @author Valkream Team
 * @license MIT-NC
 */

const DatabaseLib = require("better-sqlite3");
const fs = require("fs");
const path = require("path");

const { isDev } = require("../constants/index.js");
const DirsManager = require("../manager/dirsManager.js");

class Database {
  constructor() {
    const dbPath = path.join(DirsManager.dbPath(), "databases");
    if (!fs.existsSync(dbPath)) fs.mkdirSync(dbPath, { recursive: true });
    const fileName = isDev ? "Databases.sqlite" : "Databases.db";
    this.db = new DatabaseLib(path.join(dbPath, fileName));
  }

  createTable(tableName) {
    this.db
      .prepare(
        `CREATE TABLE IF NOT EXISTS ${tableName} (id INTEGER PRIMARY KEY, json_data TEXT)`
      )
      .run();
  }

  createData(tableName, data) {
    this.createTable(tableName);
    const stmt = this.db.prepare(
      `INSERT INTO ${tableName} (json_data) VALUES (?)`
    );
    const info = stmt.run(JSON.stringify(data));
    return { ...data, ID: info.lastInsertRowid };
  }

  readData(tableName, key = 1) {
    this.createTable(tableName);
    const row = this.db
      .prepare(`SELECT * FROM ${tableName} WHERE id=?`)
      .get(key);
    if (!row) return undefined;
    return { ...JSON.parse(row.json_data), ID: row.id };
  }

  readAllData(tableName) {
    this.createTable(tableName);
    const rows = this.db.prepare(`SELECT * FROM ${tableName}`).all();
    return rows.map((row) => ({ ...JSON.parse(row.json_data), ID: row.id }));
  }

  updateData(tableName, data, key = 1) {
    this.createTable(tableName);
    this.db
      .prepare(`UPDATE ${tableName} SET json_data=? WHERE id=?`)
      .run(JSON.stringify(data), key);
    return this.readData(tableName, key);
  }

  deleteData(tableName, key = 1) {
    this.createTable(tableName);
    return this.db.prepare(`DELETE FROM ${tableName} WHERE id=?`).run(key);
  }
}

module.exports = Database;
