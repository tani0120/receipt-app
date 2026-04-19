// src/server.ts
import { config } from 'dotenv'
config({ path: '.env.local' })  // .env.localを明示的に読み込む（VERTEX_PROJECT_ID等）

import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import conversionRoute from './api/routes/conversion'
import clientsRoute from './api/routes/clients'
import journalStatusRoute from './api/routes/journal-status'
import journalEntryRoute from './api/routes/journal-entry'
import aiRulesRoute from './api/routes/ai-rules'
import adminRoute from './api/routes/admin'
import workerRoute from './api/routes/worker'
import aiModelsRoute from './api/routes/ai-models'
import documentsRoute from './api/routes/documents'
import pipelineRoute from './api/routes/pipeline'

const app = new Hono()
const port = parseInt(process.env.PORT || '8080')

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

// Phase 4 Step 2: Clients Route
app.route('/api/clients', clientsRoute)

// Phase 4 Step 3-4: Journal Routes
app.route('/api/journal-status', journalStatusRoute)
app.route('/api/journal-entry', journalEntryRoute)

// Phase 4 Step 7-8: AI Rules and Admin Routes
app.route('/api/ai-rules', aiRulesRoute)
app.route('/api/admin', adminRoute)

// Phase 4 Step 9-10: Worker and AI Routes (Final)
app.route('/api/worker', workerRoute)
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

// Pipeline API: パイプライン結合テスト（Step 0-1: classify / extract）
app.route('/api/pipeline', pipelineRoute)

// Drive API: Google Drive連携（ファイル一覧取得・処理）
import driveRoute from './api/routes/drive'
app.route('/api/drive', driveRoute)

// Doc Store API: ドキュメントJSON永続化
import docStoreRoute from './api/routes/docStore'
app.route('/api/doc-store', docStoreRoute)

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

// プロセスが終了しないように維持
process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received, shutting down gracefully')
    process.exit(0)
})

// Keep-aliveメッセージ（Cloud Runログで確認用）
setInterval(() => {
    console.log('💓 Server heartbeat - still running')
}, 30000) // 30秒ごと
