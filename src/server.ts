import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import app from './api/index.js'

const port = Number(process.env.PORT) || 3000
console.log('--- SERVER STARTING ---');
console.log('Node Version:', process.version);
console.log('Environment:', process.env.NODE_ENV);
console.log('PORT Env Var:', process.env.PORT);
console.log(`Server is running on port ${port}`);

// Serve static files from 'dist/client' folder
app.use('/*', serveStatic({ root: './dist/client' }))

// SPA wildcard fallback
app.get('*', serveStatic({ path: './dist/client/index.html' }))

serve({
    fetch: app.fetch,
    port,
    hostname: '0.0.0.0'
})
