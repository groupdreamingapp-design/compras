
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// You need to set the FIREBASE_SERVICE_ACCOUNT_KEY env variable with the JSON content of your service account key
// OR use specific env vars if you prefer.
// For this setup, we assume the whole JSON is in one env var or parsed from separate ones if needed.

if (!getApps().length) {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        try {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
            initializeApp({
                credential: cert(serviceAccount)
            });
        } catch (e) {
            console.error("Error parsing FIREBASE_SERVICE_ACCOUNT_KEY:", e);
        }
    } else {
        console.warn("FIREBASE_SERVICE_ACCOUNT_KEY not set. Firebase Admin not initialized.");
    }
}

export const adminDb = getApps().length ? getFirestore() : null;
