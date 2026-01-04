import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { config } from '../config';

// Singleton initialization
// Singleton initialization
if (!admin.apps.length) {
    try {
        if (config.FIREBASE_PROJECT_ID && config.FIREBASE_PRIVATE_KEY) {
            console.log('[Firebase] Initializing with Env Vars (PrivateKey found).');
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: config.FIREBASE_PROJECT_ID,
                    clientEmail: config.FIREBASE_CLIENT_EMAIL,
                    privateKey: config.FIREBASE_PRIVATE_KEY,
                }),
            });
        } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
            console.log(`[Firebase] Initializing with Application Default Credentials (path: ${process.env.GOOGLE_APPLICATION_CREDENTIALS}).`);
            admin.initializeApp({
                credential: admin.credential.applicationDefault(),
                projectId: config.FIREBASE_PROJECT_ID
            });
        } else {
            console.error('[Firebase] Critical: No credentials found.');
            // For checking environment variables
            console.error('DEBUG: FIREBASE_PROJECT_ID=', config.FIREBASE_PROJECT_ID ? 'SET' : 'MISSING');
            console.error('DEBUG: FIREBASE_PRIVATE_KEY=', config.FIREBASE_PRIVATE_KEY ? 'SET' : 'MISSING');
            throw new Error('Firebase Credentials Missing! Cannot start in Real Mode.');
        }
    } catch (e) {
        console.error('[Firebase] Initialization Failed:', e);
        // Do not swallow error - let server crash so user knows setup is wrong
        throw e;
    }
}

export const db = getFirestore();
export const adminAuth = admin.apps.length ? admin.auth() : null;
