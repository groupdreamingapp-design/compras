
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Load env
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
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

async function verify() {
    try {
        console.log("Initializing Firebase Admin for Verification...");
        const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
        const serviceAccount = JSON.parse(serviceAccountKey);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        const db = admin.firestore();

        const testCollections = [
            'usuarios', 'insumos', 'proveedores', 'ordenes_compra', 'recepcion_mercaderia', 'facturas'
        ];

        console.log("--- Collection Check ---");
        for (const col of testCollections) {
            const snapshot = await db.collection(col).limit(1).get();
            if (snapshot.empty) {
                console.error(`FAIL: Collection '${col}' is EMPTY!`);
            } else {
                console.log(`PASS: Collection '${col}' has data.`);
            }
        }

        console.log("\n--- Sample Data Integrity Check ---");
        const insumoSnapshot = await db.collection('insumos').limit(1).get();
        if (!insumoSnapshot.empty) {
            const data = insumoSnapshot.docs[0].data();
            console.log(`Sample Insumo: ${data.Nombre} (ID: ${insumoSnapshot.docs[0].id})`);
            if (!data.Nombre) console.error("FAIL: Insumo missing Nombre field.");
        }

        console.log("\nVerification complete!");
        process.exit(0);
    } catch (e) {
        console.error("Verification failed with error:", e.message);
        process.exit(1);
    }
}

verify();
