// src/server.ts — API + 静的ファイル提供（本番起動用）
import { config } from 'dotenv'
config({ path: '.env.local' })  // .env.localを明示的に読み込む（VERTEX_PROJECT_ID等）

import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
// ルート定義はrouteTree.tsに一元化（SSOT）
import routeTree from './api/routeTree'

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

// Health check（server.ts固有 — routeTreeには含めない）
app.get('/health', (c) => {
    console.log('Health check received')
    return c.text('OK')
})

// 全APIルートをrouteTreeから一括マウント
app.route('', routeTree)


// Phase 2: 静的ファイル提供（フロントエンドUI）
// 開発時はVite開発サーバーが配信するため、dist/clientが存在する本番時のみ有効化
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
const distClientPath = resolve(process.cwd(), 'dist', 'client')
if (existsSync(distClientPath)) {
  app.use('/*', serveStatic({ root: './dist/client' }))
  console.log('✅ 静的ファイル配信: dist/client')
} else {
  console.log('ℹ️ dist/client未検出（開発モード: Viteが配信）')
}

app.get('/', (c) => {
    console.log('Root request received')
    return c.text('Document API is running')
})

console.log('🔧 Starting HTTP server...')

// Phase D-5: 移行バックグラウンドワーカー起動
import { startMigrationWorker, stopMigrationWorker } from './api/services/migration/migrationWorker'

// MF自動取得スケジューラ
import { startMfSyncScheduler, stopMfSyncScheduler } from './api/services/mfSyncScheduler'

// Driveポーリングワーカー（1時間バッチ）
import { startDrivePollingWorker, stopDrivePollingWorker } from './api/services/drive/drivePollingWorker'

// Keep-aliveタイマー（Cloud Runログ確認用）
const heartbeatTimer = setInterval(() => {
    console.log('💓 Server heartbeat - still running')
}, 30000)

/**
 * Graceful Shutdown
 * - HTTPサーバーを閉じてポートを即解放
 * - migrationWorkerを停止
 * - heartbeatタイマーをクリア（プロセスの残留を防止）
 */
function gracefulShutdown(signal: string) {
    console.log(`🛑 ${signal} received, shutting down gracefully`)
    clearInterval(heartbeatTimer)
    stopMigrationWorker()
    stopMfSyncScheduler()
    stopDrivePollingWorker()
    httpServer.close(() => {
        console.log('✅ HTTP server closed')
        process.exit(0)
    })
    // 5秒以内にclose完了しなければ強制終了
    setTimeout(() => {
        console.warn('⚠️ 強制終了（close timeout）')
        process.exit(1)
    }, 5000).unref()
}

// serve()の戻り値(http.Server)を保持 → shutdown時にclose()でポート即解放
const httpServer = serve({
    fetch: app.fetch,
    port,
    hostname: '0.0.0.0',
})

// EADDRINUSEエラーハンドリング: 旧プロセスが残っている場合にポートをkillしてリトライ
let retried = false
httpServer.on('error', async (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE' && !retried) {
        retried = true
        console.warn(`⚠️ ポート ${port} が使用中。旧プロセスをkillしてリトライ...`)
        try {
            const { execSync } = await import('node:child_process')
            execSync(`npx kill-port ${port}`, { timeout: 5000, stdio: 'pipe' })
            console.log(`✅ ポート ${port} を解放。2秒後にリトライ`)
            setTimeout(() => {
                httpServer.listen({ port, hostname: '0.0.0.0' })
            }, 2000)
        } catch {
            console.error(`❌ ポート ${port} のkillに失敗。手動で npx kill-port ${port} を実行してください`)
            clearInterval(heartbeatTimer)
            process.exit(1)
        }
        return
    }
    if (err.code === 'EADDRINUSE' && retried) {
        console.error(`❌ ポート ${port} リトライ失敗。手動で npx kill-port ${port} を実行してください`)
        clearInterval(heartbeatTimer)
        process.exit(1)
    }
    throw err
})

httpServer.on('listening', () => {
    console.log(`✅ Server listening on http://0.0.0.0:${port}`)
    // サーバー起動成功後にワーカー起動
    startMigrationWorker().catch(err => {
        console.warn('⚠️ migrationWorker起動失敗（Supabase未接続の可能性）:', err instanceof Error ? err.message : String(err))
    })
    // MF自動取得スケジューラ起動
    startMfSyncScheduler()
    // Driveポーリングワーカー起動
    startDrivePollingWorker()
})

// SIGTERM（docker stop, Cloud Run）+ SIGINT（Ctrl+C, nodemon restart）の両方を処理
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))

 
