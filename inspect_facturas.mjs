
import dbQuery from './src/lib/db.js';

async function run() {
    try {
        console.log("--- Facturas ---");
        const schemaFacturas = await dbQuery.prepare("PRAGMA table_info(Facturas)").all();
        console.log(JSON.stringify(schemaFacturas, null, 2));
    } catch (error) {
        console.error(error);
    }
}

run();
