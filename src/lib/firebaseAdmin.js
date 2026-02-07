
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// You need to set the FIREBASE_SERVICE_ACCOUNT_KEY env variable with the JSON content of your service account key
// OR use specific env vars if you prefer.
// For this setup, we assume the whole JSON is in one env var or parsed from separate ones if needed.

if (!getApps().length) {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        try {
            let keyString = process.env.FIREBASE_SERVICE_ACCOUNT_KEY.trim();

            // Handle cases where the key might be wrapped in single quotes in the env provider
            if (keyString.startsWith("'") && keyString.endsWith("'")) {
                keyString = keyString.substring(1, keyString.length - 1).trim();
            }

            const serviceAccount = JSON.parse(keyString);
            initializeApp({
                credential: cert(serviceAccount)
            });
        } catch (e) {
            console.error("Error parsing FIREBASE_SERVICE_ACCOUNT_KEY:", e.message);
            console.error("Value length:", process.env.FIREBASE_SERVICE_ACCOUNT_KEY?.length);
            console.error("Starts with:", process.env.FIREBASE_SERVICE_ACCOUNT_KEY?.substring(0, 10));
        }
    } else {
        console.warn("FIREBASE_SERVICE_ACCOUNT_KEY not set. Firebase Admin not initialized.");
    }
}

export const adminDb = getApps().length ? getFirestore() : null;
