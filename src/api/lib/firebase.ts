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
        } else {
            console.log('[Firebase] Initializing with Application Default Credentials (ADC) for Cloud Environment.');
            const firebaseConfig: any = {
                credential: admin.credential.applicationDefault()
            };
            if (config.FIREBASE_PROJECT_ID) {
                firebaseConfig.projectId = config.FIREBASE_PROJECT_ID;
            }
            admin.initializeApp(firebaseConfig);
        }
    } catch (e) {
        console.error('[Firebase] Initialization Failed:', e);
        // Do not swallow error - let server crash so user knows setup is wrong
        throw e;
    }
}

export const db = getFirestore();
export const adminAuth = admin.apps.length ? admin.auth() : null;
