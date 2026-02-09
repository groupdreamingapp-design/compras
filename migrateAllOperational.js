
const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');
const admin = require('firebase-admin');

// 1. Cargar variables de entorno manualmente desde .env.local
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    console.log("Loading .env.local...");
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
        const index = line.indexOf('=');
        if (index > 0) {
            const key = line.substring(0, index).trim();
            let value = line.substring(index + 1).trim();
            value = value.replace(/^['"](.*)['"]$/, '$1');
            process.env[key] = value;
        }
    });
}

async function migrate() {
    try {
        // 2. Inicializar Firebase Admin
        console.log("Initializing Firebase Admin...");
        const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
        if (!serviceAccountKey) {
            throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY not found in .env.local");
        }

        const serviceAccount = JSON.parse(serviceAccountKey);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        const dbFirestore = admin.firestore();

        // 3. Leer SQLite
        console.log("Reading SQLite database...");
        const wasmPath = path.join(process.cwd(), 'node_modules/sql.js/dist/sql-wasm.wasm');
        const wasmBinary = fs.readFileSync(wasmPath);
        const SQL = await initSqlJs({ wasmBinary });

        const dbPath = path.join(process.cwd(), 'purchasing.db');
        if (!fs.existsSync(dbPath)) {
            throw new Error("purchasing.db not found");
        }
        const fileBuffer = fs.readFileSync(dbPath);
        const dbSqlite = new SQL.Database(fileBuffer);

        const tables = [
            'Rubros', 'Subrubros', 'Proveedores', 'Insumos',
            'Ordenes_Compra', 'Detalle_OC',
            'Recepcion_Mercaderia', 'Detalle_Recepcion',
            'Facturas', 'Detalle_Factura',
            'Insumo_Valuacion', 'Movimientos_Stock',
            // NEW TABLES
            'Platos', 'Fichas_Tecnicas', 'Recetas', 'Detalle_Receta',
            'Ventas_Cabecera', 'Ventas_Detalle', 'Ventas_POS', 'Lista_Precios_Pactados'
        ];

        for (const tableName of tables) {
            console.log(`Processing table: ${tableName}...`);
            const rows = [];
            const stmt = dbSqlite.prepare(`SELECT * FROM ${tableName}`);
            while (stmt.step()) {
                rows.push(stmt.getAsObject());
            }
            stmt.free();

            if (rows.length === 0) {
                console.log(`Table ${tableName} is empty. Skipping.`);
                continue;
            }

            // Firestore collection name (lowercase)
            const collectionName = tableName.toLowerCase();
            const collectionRef = dbFirestore.collection(collectionName);

            // Chunking into batches of 500 (Firestore limit)
            for (let i = 0; i < rows.length; i += 500) {
                const batch = dbFirestore.batch();
                const chunk = rows.slice(i, i + 500);

                chunk.forEach(row => {
                    const docId = row.ID ? row.ID.toString() : null;
                    const docRef = docId ? collectionRef.doc(docId) : collectionRef.doc();

                    // Convert potential nulls or buffer-like values if any
                    const cleanRow = { ...row };
                    Object.keys(cleanRow).forEach(key => {
                        if (cleanRow[key] === null) delete cleanRow[key];
                    });

                    batch.set(docRef, {
                        ...cleanRow,
                        migratedAt: new Date().toISOString()
                    });
                });

                console.log(`Committing batch of ${chunk.length} for ${tableName}...`);
                await batch.commit();
            }
        }

        console.log("Migration SUCCESSFUL!");
        process.exit(0);

    } catch (error) {
        console.error("Migration FAILED:", error);
        process.exit(1);
    }
}

migrate();
