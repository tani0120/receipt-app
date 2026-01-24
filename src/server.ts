// src/server.ts - 超シンプル版（デバッグ用）
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

// まず最小限のエンドポイントだけ
app.get('/health', (c) => c.text('OK'))
app.get('/', (c) => c.text('Receipt API is running'))

// API routesは後で追加
// import apiRoutes from './api/index.js';
// app.route('/api', apiRoutes);

// 静的ファイルも後で追加
// app.use('/*', serveStatic({ root: './dist/client' }));

console.log('🔧 Starting HTTP server...')

serve({
    fetch: app.fetch,
    port,
    hostname: '0.0.0.0',
})

console.log(`✅ Server listening on http://0.0.0.0:${port}`)
