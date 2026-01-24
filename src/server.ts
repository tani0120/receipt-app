import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import app from './api/index'
import { access } from 'fs/promises'

const port = Number(process.env.PORT) || 3000

console.log('🚀 Starting server...')
console.log('📁 Current directory:', process.cwd())
console.log('Node Version:', process.version)
console.log('Environment:', process.env.NODE_ENV)
console.log('PORT Env Var:', process.env.PORT)
console.log(`Server is running on port ${port}`)

// dist/client の存在確認
try {
    await access('./dist/client')
    console.log('✅ dist/client exists')
} catch {
    console.log('❌ dist/client missing')
}

// Serve static files from 'dist/client' folder
app.use('/*', serveStatic({
    root: './dist/client',
    onNotFound: (path, c) => {
        console.log('⚠️  Static file not found:', path)
    }
}))

// SPA wildcard fallback
app.get('*', serveStatic({ path: './dist/client/index.html' }))

try {
    serve({
        fetch: app.fetch,
        port,
        hostname: '0.0.0.0'
    })
    console.log(`✅ Server running on port ${port}`)
} catch (error) {
    console.error('❌ Failed to start server:', error)
    process.exit(1)
}
