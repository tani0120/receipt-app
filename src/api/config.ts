import dotenv from 'dotenv';

// Load .env file
dotenv.config();

// Helper to ensure env var exists
const getEnv = (key: string, required = true): string => {
    const val = process.env[key];
    if (required && !val) {
        // Warning instead of Error for now to prevent crash if backend starts without full env setup during dev
        console.warn(`[Config] Missing environment variable: ${key}`);
        return '';
    }
    return val || '';
};

export const config = {
    // Server
    PORT: Number(process.env.PORT) || 3000,

    // Firebase Admin (Service Account)
    // In production, these might be injected or loaded from a file path
    FIREBASE_PROJECT_ID: getEnv('FIREBASE_PROJECT_ID'),
    FIREBASE_CLIENT_EMAIL: getEnv('FIREBASE_CLIENT_EMAIL'),
    FIREBASE_PRIVATE_KEY: getEnv('FIREBASE_PRIVATE_KEY') ? getEnv('FIREBASE_PRIVATE_KEY').replace(/\\n/g, '\n') : '',

    // Gemini
    GEMINI_API_KEY: getEnv('GEMINI_API_KEY', false), // Optional if using Vertex
    USE_VERTEX_AI: getEnv('USE_VERTEX_AI', false) === 'true',

    // Feature Flags (for gradual rollout)
    ENABLE_REAL_FIRESTORE: getEnv('ENABLE_REAL_FIRESTORE', false) === 'true',
    ENABLE_REAL_GEMINI: getEnv('ENABLE_REAL_GEMINI', false) === 'true',
};
