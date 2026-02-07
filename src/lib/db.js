import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Singleton instance container
let dbInstance = null;
const dbPath = path.join(process.cwd(), 'purchasing.db');

async function getDb() {
  if (dbInstance) return dbInstance;

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  // Navigate from sys/lib/db.js -> src/lib -> src -> root -> node_modules
  const wasmPath = path.resolve(__dirname, '../../node_modules/sql.js/dist/sql-wasm.wasm');

  if (!fs.existsSync(wasmPath)) {
    console.error("WASM file not found at:", wasmPath);
    throw new Error(`WASM file not found at ${wasmPath}`);
  }

  const wasmBinary = fs.readFileSync(wasmPath);

  // Carga como dependencia externa de Node para evitar conflictos con Webpack
  const initSqlJs = require('sql.js');
  const SQL = await initSqlJs({ wasmBinary });

  let buffer;
  try {
    if (fs.existsSync(dbPath)) {
      buffer = fs.readFileSync(dbPath);
    }
  } catch (err) {
    console.error("Error reading DB file:", err);
  }

  // Create DB from file or new
  const db = new SQL.Database(buffer);
  dbInstance = db;
  return db;
}

// Helper to save DB to disk (must be called manually after writes in this WASM version)
export function saveDb() {
  if (!dbInstance) return;
  const data = dbInstance.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
}

export { getDb };

// Helper for "prepare().all()" style used in code
export const dbQuery = {
  prepare: (sql) => {
    return {
      all: async (...params) => {
        const db = await getDb();
        const stmt = db.prepare(sql);
        stmt.bind(params);
        const res = [];
        while (stmt.step()) {
          res.push(stmt.getAsObject());
        }
        stmt.free();
        return res;
      },
      get: async (...params) => {
        const db = await getDb();
        const stmt = db.prepare(sql);
        stmt.bind(params);
        let res = null;
        if (stmt.step()) {
          res = stmt.getAsObject();
        }
        stmt.free();
        return res;
      },
      run: async (...params) => {
        const db = await getDb();
        db.run(sql, params);
        // Return object mimicking better-sqlite3
        const res = db.exec("SELECT last_insert_rowid()");
        const id = res[0] && res[0].values[0] ? res[0].values[0][0] : 0;
        return { lastInsertRowid: id };
      }
    }
  },
  exec: async (sql) => {
    const db = await getDb();
    db.exec(sql);
  },
  transaction: (fn) => {
    return async () => {
      const db = await getDb();
      db.exec("BEGIN TRANSACTION");
      try {
        await fn();
        db.exec("COMMIT");
        saveDb();
      } catch (e) {
        db.exec("ROLLBACK");
        throw e;
      }
    }
  }
};

export default dbQuery;
