
import dbQuery from './src/lib/db.js';

async function run() {
    try {
        const columns = await dbQuery.prepare("PRAGMA table_info(Facturas)").all();
        console.log(columns.map(c => c.name).join(', '));
    } catch (error) {
        console.error(error);
    }
}

run();
