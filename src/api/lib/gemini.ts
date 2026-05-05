import { GoogleGenAI } from '@google/genai';
import { config } from '../config';

let client: GoogleGenAI | null = null;

if (config.USE_VERTEX_AI) {
    // Vertex AI (Service Account)
    const projectId = config.GCP_PROJECT_ID;
    if (!projectId) {
        console.error('[Gemini] GCP_PROJECT_ID が未設定です。.env.local に GCP_PROJECT_ID を設定してください。');
    }
    const location = 'us-central1';

    try {
        client = new GoogleGenAI({ vertexai: true, project: projectId, location });
        console.log('[Gemini] Helper initialized via Vertex AI (Service Account).');
    } catch (e) {
        console.error('[Gemini] Vertex AI Initialization failed:', e);
    }

} else if (config.GEMINI_API_KEY) {
    // Gemini Developer API (API Key)
    try {
        client = new GoogleGenAI({ apiKey: config.GEMINI_API_KEY });
        console.log('[Gemini] Helper initialized via Gemini Developer API (API Key).');
    } catch (e) {
        console.error('[Gemini] Gemini Developer API Initialization failed:', e);
    }
} else {
    console.warn('[Gemini] No credentials found. AI features disabled.');
}

export const geminiClient = client;
