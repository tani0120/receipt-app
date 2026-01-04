
import dotenv from 'dotenv';
import path from 'path';

// Explicitly load .env from root
dotenv.config({ path: path.join(process.cwd(), '.env') });

const certPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (certPath) {
    const absPath = path.resolve(process.cwd(), certPath);
    console.log('Setting GOOGLE_APPLICATION_CREDENTIALS to absolute path:', absPath);
    process.env.GOOGLE_APPLICATION_CREDENTIALS = absPath;
}

import { db } from '../src/api/lib/firebase';
import { geminiModel } from '../src/api/lib/gemini';
import { config } from '../src/api/config';

async function verify() {
    console.log('--- Infrastructure Verification ---');
    console.log('Use Vertex AI:', config.USE_VERTEX_AI);

    // 1. Verify Firebase
    try {
        console.log('Testing Firebase Connection...');
        const collections = await db.listCollections();
        console.log('✅ Firebase Connected. Collections:', collections.map(c => c.id));
    } catch (e: any) {
        console.error('❌ Firebase Connection Failed:', e.message);
    }

    // 2. Verify Gemini
    try {
        console.log('Testing Gemini Client...');
        if (geminiModel) {
            console.log('✅ Gemini Client Initialized:', config.USE_VERTEX_AI ? '(Vertex AI)' : '(AI Studio)');
            // Optional: Dry run generation?
            // const result = await geminiModel.generateContent('Hello');
            // console.log('Response:', result.response.text());
        } else {
            console.error('❌ Gemini Client is NULL');
        }
    } catch (e: any) {
        console.error('❌ Gemini Error:', e.message);
    }
}

verify();
