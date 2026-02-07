
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
            // Remove single or double quotes surrounding the value
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

        const users = [];
        const stmt = dbSqlite.prepare('SELECT * FROM Usuarios');
        while (stmt.step()) {
            users.push(stmt.getAsObject());
        }
        stmt.free();

        console.log(`Found ${users.length} users in SQLite.`);

        // 4. Migrar a Firestore
        const batch = dbFirestore.batch();
        const usersCollection = dbFirestore.collection('usuarios');

        for (const user of users) {
            console.log(`Migrating user: ${user.Nombre} (ID: ${user.ID})`);
            const userRef = usersCollection.doc(user.ID.toString());
            batch.set(userRef, {
                ...user,
                updatedAt: new Date().toISOString()
            });
        }

        console.log("Committing to Firestore...");
        await batch.commit();
        console.log("Migration SUCCESSFUL!");
        process.exit(0);

    } catch (error) {
        console.error("Migration FAILED:", error);
        process.exit(1);
    }
}

migrate();
