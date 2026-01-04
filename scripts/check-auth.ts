
import fs from 'fs';
import dotenv from 'dotenv';
import path from 'path';
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

// Load .env
dotenv.config({ path: path.join(process.cwd(), '.env') });

async function check() {
    try {
        console.log('Checking Auth...');
        const keyPath = path.resolve(process.cwd(), 'certs/service-account.json');
        console.log('Key Path:', keyPath);

        const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: process.env.FIREBASE_PROJECT_ID
        });

        const db = getFirestore();
        await db.listCollections();
        console.log('FIREBASE_AUTH_OK');
    } catch (e: any) {
        console.error('FIREBASE_AUTH_FAIL:', e.message);
        process.exit(1);
    }
}
check();
