import { GoogleGenerativeAI } from '@google/generative-ai';
import { VertexAI } from '@google-cloud/vertexai';
import { config } from '../config';

let model: any = null;

if (config.USE_VERTEX_AI) {
    // Vertex AI (Service Account)
    // Note: Project & Location should be config/env derived ideally, but defaulting or using .env
    const projectId = config.FIREBASE_PROJECT_ID || 'gen-lang-client-0837543731'; // Fallback to known
    const location = 'us-central1'; // Default location for Gemini

    try {
        const vertexAI = new VertexAI({ project: projectId, location });
        model = vertexAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        console.log('[Gemini] Helper initialized via Vertex AI (Service Account).');
    } catch (e) {
        console.error('[Gemini] Vertex AI Initialization failed:', e);
    }

} else if (config.GEMINI_API_KEY) {
    // AI Studio (API Key)
    try {
        const genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
        model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        console.log('[Gemini] Helper initialized via AI Studio (API Key).');
    } catch (e) {
        console.error('[Gemini] AI Studio Initialization failed:', e);
    }
} else {
    console.warn('[Gemini] No credentials found. AI features disabled.');
}

export const geminiModel = model;
