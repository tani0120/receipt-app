import { serve } from '@hono/node-server'
import { Hono } from 'hono'

const app = new Hono()

app.get('/', (c) => c.text('Health Check OK'))

const port = Number(process.env.PORT) || 8080
console.log(`Health check server starting on port ${port} (0.0.0.0)`)

serve({
    fetch: app.fetch,
    port,
    hostname: '0.0.0.0'
})
