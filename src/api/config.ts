
import dotenv from 'dotenv'

dotenv.config()

export const config = {
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    USE_VERTEX_AI: process.env.USE_VERTEX_AI === 'true',
    FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET
}
