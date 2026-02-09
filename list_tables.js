
const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

async function listTables() {
    const wasmBinary = fs.readFileSync(path.join('./node_modules/sql.js/dist/sql-wasm.wasm'));
    const SQL = await initSqlJs({ wasmBinary });
    const db = new SQL.Database(fs.readFileSync('purchasing.db'));
    const res = db.exec("SELECT name FROM sqlite_master WHERE type='table'");
    console.log(JSON.stringify(res[0].values.map(v => v[0])));
}

listTables().catch(console.error);
