/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

const { NodeBDD, DataType } = require("node-bdd");
const nodedatabase = new NodeBDD();
const path = require("path");

const { isDev } = require("../constants/index.js");
const DirsManager = require("../manager/dirsManager.js");

class Database {
  async createDatabase(tableName, tableConfig) {
    return await nodedatabase.intilize({
      databaseName: "Databases",
      fileType: isDev ? "sqlite" : "db",
      tableName,
      path: path.join(DirsManager.rootPath(), "databases"),
      tableColumns: tableConfig,
    });
  }

  async getDatabase(tableName) {
    return await this.createDatabase(tableName, {
      json_data: DataType.TEXT, // Corrigé
    });
  }

  async createData(tableName, data) {
    const table = await this.getDatabase(tableName);
    let row = await nodedatabase.createData(table, {
      json_data: JSON.stringify(data),
    });

    return {
      ...JSON.parse(row.json_data),
      ID: row.id,
    };
  }

  async readData(tableName, key = 1) {
    const table = await this.getDatabase(tableName);
    const row = await nodedatabase.getDataById(table, key);

    if (!row) return undefined;

    return {
      ...JSON.parse(row.json_data),
      ID: row.id,
    };
  }

  async readAllData(tableName) {
    const table = await this.getDatabase(tableName);
    const rows = await nodedatabase.getAllData(table);

    return rows.map((row) => ({
      ...JSON.parse(row.json_data),
      ID: row.id,
    }));
  }

  async updateData(tableName, data, key = 1) {
    const table = await this.getDatabase(tableName);
    await nodedatabase.updateData(
      table,
      { json_data: JSON.stringify(data) },
      key
    );

    return this.readData(tableName, key); // on retourne la donnée mise à jour
  }

  async deleteData(tableName, key = 1) {
    const table = await this.getDatabase(tableName);
    return await nodedatabase.deleteData(table, key);
  }
}

module.exports = Database;
