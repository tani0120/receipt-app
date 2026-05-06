// src/server.ts
import { config } from 'dotenv'
config({ path: '.env.local' })  // .env.localを明示的に読み込む（VERTEX_PROJECT_ID等）

import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import conversionRoute from './api/routes/conversion'

// 旧ai-rulesは廃止・削除済み。学習ページに移行
import adminRoute from './api/routes/admin'
import aiModelsRoute from './api/routes/ai-models'
import documentsRoute from './api/routes/documents'
import pipelineRoute from './api/routes/pipeline'

import crypto from 'node:crypto'

const app = new Hono<{ Variables: { requestId: string } }>()
const port = parseInt(process.env.PORT || '8080')

// リクエストIDミドルウェア: 全リクエストにUUID短縮8桁を付与
app.use('*', async (c, next) => {
  const requestId = crypto.randomUUID().slice(0, 8)
  c.set('requestId', requestId)
  c.header('X-Request-Id', requestId)
  console.log(`[${requestId}] ${c.req.method} ${c.req.path}`)
  await next()
})

console.log('='.repeat(50))
console.log('🚀 Server starting...')
console.log('Node:', process.version)
console.log('CWD:', process.cwd())
console.log('PORT:', port)
console.log('ENV:', process.env.NODE_ENV)
console.log('='.repeat(50))

// Phase 1: Health check
app.get('/health', (c) => {
    console.log('Health check received')
    return c.text('OK')
})

// Simple API endpoint (Phase 1)
app.get('/api/hello', (c) => {
    console.log('API hello endpoint called')
    return c.json({ message: 'Hello from Hono API!', status: 'running' })
})

// Phase 4 Step 1: Conversion Route
app.route('/api/conversion', conversionRoute)



// Phase 4 Step 7-8: Admin Route（旧ai-rulesは廃止・削除済み）
app.route('/api/admin', adminRoute)

// Phase 4 Step 9-10: AI Routes
app.route('/api/ai-models', aiModelsRoute)

// Phase 6.3: OCR Route (Vertex AI) - 遅延import
if (process.env.ENABLE_OCR === 'true') {
    const { default: ocrRoute } = await import('./api/routes/ocr')
    app.route('/api/ocr', ocrRoute)
    console.log('✅ OCR Route enabled')
} else {
    console.log('⚠️ OCR Route disabled (ENABLE_OCR not set to true)')
}

// Phase 1 Step 1.4: Documents Route (PostgreSQL統合)
app.route('/api/documents', documentsRoute)

// Pipeline API: パイプライン結合テスト（Step 0-1: previewExtract / extract）
app.route('/api/pipeline', pipelineRoute)

// Drive API: Google Drive連携（ファイル一覧取得・処理）
import driveRoute from './api/routes/drive'
app.route('/api/drive', driveRoute)

// Doc Store API: ドキュメントJSON永続化
import docStoreRoute from './api/routes/docStore'
app.route('/api/doc-store', docStoreRoute)

// Staff API: スタッフJSON永続化（DL-042）
import staffRoutes from './api/routes/staffRoutes'
app.route('/api/staff', staffRoutes)

// Auth API: ログインスタッフ管理（DL-042）
import authRoutes from './api/routes/authRoutes'
app.route('/api/auth', authRoutes)

// Client API: 顧問先JSON永続化（DL-042）
import clientRoutes from './api/routes/clientRoutes'
app.route('/api/clients', clientRoutes)

// Journal API: 仕訳JSON永続化（DL-042 #12）
import journalRoutes from './api/routes/journalRoutes'
app.route('/api/journals', journalRoutes)

// ExportHistory API: 出力履歴+CSVスナップショットJSON永続化（DL-042 S1）
import exportHistoryRoutes from './api/routes/exportHistoryRoutes'
app.route('/api/export-history', exportHistoryRoutes)

// Vendor API: 取引先JSON永続化（DL-042）
import { loadVendors } from './api/services/vendorStore'
await loadVendors()
import vendorRoutes from './api/routes/vendorRoutes'
app.route('/api/vendors', vendorRoutes)

// ShareStatus API: 共有設定JSON永続化（DL-043）
import shareStatusRoutes from './api/routes/shareStatusRoutes'
app.route('/api/share-status', shareStatusRoutes)

// GuestAuth API: ゲスト認証JSON永続化（DL-043）
import guestAuthRoutes from './api/routes/guestAuthRoutes'
app.route('/api/guest', guestAuthRoutes)

// Notification API: 通知JSON永続化（DL-047）
import notificationRoutes from './api/routes/notificationRoutes'
app.route('/api/notifications', notificationRoutes)

// ConfirmedJournal API: 確定済み仕訳JSON永続化（T-03 / DL-053）
import confirmedJournalRoutes from './api/routes/confirmedJournalRoutes'
app.route('/api/confirmed-journals', confirmedJournalRoutes)

// ActivityLog API: 活動ログJSON永続化（DL-042）
import activityLogRoutes from './api/routes/activityLogRoutes'
app.route('/api/activity-log', activityLogRoutes)

// IndustryVector API: 業種ベクトルJSON永続化（DL-042）
import industryVectorRoutes from './api/routes/industryVectorRoutes'
app.route('/api/industry-vectors', industryVectorRoutes)

// AccountMaster API: 勘定科目マスタ（DL-042）
import accountMasterRoutes from './api/routes/accountMasterRoutes'
app.route('/api/accounts', accountMasterRoutes)

// TaxCategory API: 税区分マスタ（DL-042）
import taxCategoryRoutes from './api/routes/taxCategoryRoutes'
app.route('/api/tax-categories', taxCategoryRoutes)

// LearningRule API: 学習ルール（DL-042）
import learningRuleRoutes from './api/routes/learningRuleRoutes'
app.route('/api/learning-rules', learningRuleRoutes)

// Progress API: 進捗管理一覧（T-31-1）
import progressRoutes from './api/routes/progressRoutes'
app.route('/api/progress', progressRoutes)

// Export API: 仕訳出力一覧（T-31-7）
import { exportRoutes } from './api/routes/exportRoutes'
app.route('/api/export', exportRoutes)

// Phase 2: 静的ファイル提供（フロントエンドUI）
app.use('/*', serveStatic({ root: './dist/client' }))

app.get('/', (c) => {
    console.log('Root request received')
    return c.text('Document API is running')
})

console.log('🔧 Starting HTTP server...')

// serve()の戻り値はイベントループで保持されるため変数代入不要
serve({
    fetch: app.fetch,
    port,
    hostname: '0.0.0.0',
})

console.log(`✅ Server listening on http://0.0.0.0:${port}`)

// Phase D-5: 移行バックグラウンドワーカー起動
import { startMigrationWorker, stopMigrationWorker } from './api/services/migration/migrationWorker'
startMigrationWorker().catch(err => {
  console.warn('⚠️ migrationWorker起動失敗（Supabase未接続の可能性）:', err instanceof Error ? err.message : String(err))
})

// プロセスが終了しないように維持
process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received, shutting down gracefully')
    stopMigrationWorker()
    process.exit(0)
})

// Keep-aliveメッセージ（Cloud Runログで確認用）
setInterval(() => {
    console.log('💓 Server heartbeat - still running')
}, 30000) // 30秒ごと
