
import db from './src/lib/db.js';
import { adminDb } from './src/lib/firebaseAdmin.js';

async function migrate() {
    try {
        console.log("Reading users from SQLite...");
        const users = await db.prepare('SELECT * FROM Usuarios').all();
        console.log(`Found ${users.length} users.`);

        if (!adminDb) {
            throw new Error("Firebase Admin not initialized. Check your .env.local");
        }

        const batch = adminDb.batch();
        const usersCollection = adminDb.collection('usuarios');

        for (const user of users) {
            console.log(`Preparing migration for user: ${user.Nombre} (ID: ${user.ID})`);
            // We use the ID as document ID to keep it consistent
            const userRef = usersCollection.doc(user.ID.toString());
            batch.set(userRef, {
                ...user,
                updatedAt: new Date().toISOString()
            });
        }

        console.log("Executing batch commit to Firestore...");
        await batch.commit();
        console.log("Migration completed successfully!");
        process.exit(0);
    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }
}

migrate();
