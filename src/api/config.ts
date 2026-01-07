
import dotenv from 'dotenv'

dotenv.config()

export const config = {
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    USE_VERTEX_AI: process.env.USE_VERTEX_AI === 'true',
    FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET,

    // --- Operational Parameters (Restored) ---
    // ドラフト生成・監視間隔: 5分
    DRAFT_INTERVAL_MINUTES: 5,
    // Batch API結果確認間隔: 5分
    BATCH_CHECK_INTERVAL_MINUTES: 5,
    // 学習処理間隔: 60分
    LEARNING_INTERVAL_MINUTES: 60,
    // 最終確認整形間隔: 5分
    FORMATTING_CHECK_INTERVAL_MINUTES: 5,
    // 知識最適化間隔: 30日
    KNOWLEDGE_OPTIMIZATION_DAYS: 30,
    // 完了通知時刻: 9, 12, 15, 18時
    NOTIFICATION_HOURS: [9, 12, 15, 18],

    // 最大処理件数/1回 (Batch Size)
    BATCH_SIZE: 20,
    // タイムアウト: 270秒
    TIMEOUT_SECONDS: 270,
    // 最大リトライ回数: 3回
    MAX_RETRIES: 3,
    // 最適化処理数/1回: 1
    OPTIMIZATION_BATCH_SIZE: 1,
    // ジョブ履歴保持期間: 30日
    JOB_HISTORY_DAYS: 30
}
