import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Admin SDK
// Ideally use GOOGLE_APPLICATION_CREDENTIALS for production
// For Emulators, it auto-detects if FIRESTORE_EMULATOR_HOST is set.

// Force Emulator in Dev if not set
if (!process.env.FIRESTORE_EMULATOR_HOST) {
    process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
    console.log('[FirebaseAdmin] Defaulting to Emulator: 127.0.0.1:8080');
}

if (getApps().length === 0) {
    initializeApp({
        projectId: 'sugu-suru', // Match emulator project ID
        // credential: ... (Auto-detected in Cloud Run or Emulator)
    });
}

export const db = getFirestore();
