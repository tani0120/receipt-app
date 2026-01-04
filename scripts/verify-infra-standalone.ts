
import dotenv from 'dotenv';
import path from 'path';
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { VertexAI } from '@google-cloud/vertexai';

// Load .env
const envPath = path.join(process.cwd(), '.env');
dotenv.config({ path: envPath });

async function verify() {
    console.log('--- Standalone Verification ---');

    // 1. Google Creds
    let credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (credPath) {
        credPath = path.resolve(process.cwd(), credPath);
        process.env.GOOGLE_APPLICATION_CREDENTIALS = credPath; // Set absolute
        console.log('Credentials Path:', credPath);
    } else {
        console.error('❌ GOOGLE_APPLICATION_CREDENTIALS not found in .env');
    }

    // 2. Init Firebase
    try {
        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.applicationDefault(),
                projectId: process.env.FIREBASE_PROJECT_ID
            });
        }
        const db = getFirestore();
        console.log('Attempting Firebase List Collections...');
        const collections = await db.listCollections();
        console.log('✅ Firebase Connected! Collections:', collections.map(c => c.id));
    } catch (e: any) {
        console.error('❌ Firebase Error:', e.message);
    }

    // 3. Init Gemini (Vertex)
    const useVertex = process.env.USE_VERTEX_AI === 'true';
    if (useVertex) {
        try {
            console.log('Attempting Vertex AI Init...');
            const vertexAI = new VertexAI({
                project: process.env.FIREBASE_PROJECT_ID || 'gen-lang-client-0837543731',
                location: 'us-central1'
            });
            const model = vertexAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
            console.log('✅ Vertex AI Client Initialized.');
        } catch (e: any) {
            console.error('❌ Vertex AI Error:', e.message);
        }
    }
}

verify();
