import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { config } from '../config';

// Singleton initialization
if (!admin.apps.length) {
    try {
        if (config.FIREBASE_PROJECT_ID && config.FIREBASE_PRIVATE_KEY) {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: config.FIREBASE_PROJECT_ID,
                    clientEmail: config.FIREBASE_CLIENT_EMAIL,
                    privateKey: config.FIREBASE_PRIVATE_KEY,
                }),
            });
            console.log('[Firebase] Admin SDK initialized with Env Vars.');
        } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
            // Fallback to Service Account File (Standard)
            admin.initializeApp({
                credential: admin.credential.applicationDefault(),
                projectId: config.FIREBASE_PROJECT_ID // Ensure project ID is set
            });
            console.log('[Firebase] Admin SDK initialized via GOOGLE_APPLICATION_CREDENTIALS.');
        } else {
            // Fallback for dev without creds (Mock mode support)
            console.warn('[Firebase] Credentials missing. Running in Mock-Compatible mode (Real DB calls will fail).');
        }
    } catch (e) {
        console.error('[Firebase] Initialization failed:', e);
    }
}

export const db = getFirestore();
export const adminAuth = admin.apps.length ? admin.auth() : null;
