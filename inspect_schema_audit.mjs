
import dbQuery from './src/lib/db.js';

async function run() {
    try {
        console.log("--- Insumos ---");
        const schemaInsumos = await dbQuery.prepare("PRAGMA table_info(Insumos)").all();
        console.log(JSON.stringify(schemaInsumos, null, 2));

        console.log("--- Proveedores ---");
        const schemaProveedores = await dbQuery.prepare("PRAGMA table_info(Proveedores)").all();
        console.log(JSON.stringify(schemaProveedores, null, 2));
    } catch (error) {
        console.error(error);
    }
}

run();
