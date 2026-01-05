import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import app from './api/index.ts'

const port = Number(process.env.PORT) || 3000
console.log(`Server is running on port ${port}`)

// Serve static files from 'dist' folder
app.use('/*', serveStatic({ root: './dist' }))

// SPA wildcard fallback (ensure this is last if possible, but Hono might match wildcard eagerly)
// Since API routes are defined in 'app' before this file imports it, they take precedence?
// Actually 'app' is imported with routes already attached.
// So adding middleware here adds it to the END of the stack.
// Perfect for static fallback.
app.get('*', serveStatic({ path: './dist/index.html' }))

serve({
    fetch: app.fetch,
    port
})
