// src/server.ts
import { serve } from '@hono/node-server'
import { Hono } from 'hono'

const app = new Hono()
const port = parseInt(process.env.PORT || '8080')

console.log('='.repeat(50))
console.log('🚀 Server starting...')
console.log('Node:', process.version)
console.log('CWD:', process.cwd())
console.log('PORT:', port)
console.log('ENV:', process.env.NODE_ENV)
console.log('='.repeat(50))

app.get('/health', (c) => {
    console.log('Health check received')
    return c.text('OK')
})

app.get('/', (c) => {
    console.log('Root request received')
    return c.text('Receipt API is running')
})

console.log('🔧 Starting HTTP server...')

// ⚠️ CRITICAL: serve()の戻り値を保持してプロセスを維持
const server = serve({
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
