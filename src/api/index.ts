
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import conversionRoute from './routes/conversion'
import clientsRoute from './routes/clients'
import journalStatusRoute from './routes/journal-status'
import journalEntry from './routes/journal-entry'
import collection from './routes/collection'
import aiRules from './routes/ai-rules'
import aiModels from './routes/ai-models'
import admin from './routes/admin'
import worker from './routes/worker'

const app = new Hono()

// Enable CORS
app.use('/*', cors({
    origin: (origin) => {
        // Allow localhost for development
        if (!origin || origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
            return origin || '*'
        }
        // Allow production domain if needed (or keep strict)
        return origin // For now reflect origin, or use specific allow list
    },
    allowHeaders: ['X-Custom-Header', 'Upgrade-Insecure-Requests', 'Content-Type', 'Authorization', 'X-Forwarded-For'],
    allowMethods: ['POST', 'GET', 'OPTIONS', 'PUT', 'DELETE'],
    exposeHeaders: ['Content-Length', 'X-Kuma-Revision'],
    maxAge: 600,
    credentials: true,
}))

// Safety: IP Restriction
app.use('*', async (c, next) => {
    // 1. ALWAYS allow local development flows
    // 'unknown' often appears in local dev without proxy headers
    if (process.env.NODE_ENV !== 'production') {
        return await next()
    }

    // 2. Production Check
    if (!process.env.ALLOWED_IPS) {
        // Safe Default: If no IPs set, BLOCK EVERYTHING in Production
        return c.text('403 Forbidden: No Access Configuration', 403)
    }

    const permitted = process.env.ALLOWED_IPS.split(',').map(ip => ip.trim())
    const forwardedFor = c.req.header('x-forwarded-for')
    // Cloud Run: First IP is true client
    const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : 'unknown'

    console.log(`[IP_CHECK] Access from: ${clientIp} (Allowed: ${permitted.join(', ')})`)

    if (permitted.includes(clientIp) || permitted.includes('*')) {
        return await next()
    }

    return c.text('403 Forbidden: Access Denied by Safety Filter', 403)
})

// --- Data Models ---
const TaxOptionSchema = z.object({
    label: z.string(),
    value: z.string(),
    rate: z.number().default(0.1),
    code: z.string().default('unknown'),
})

const JournalDataSchema = z.object({
    id: z.string(),
    date: z.string().default(new Date().toISOString().split('T')[0] ?? ''),
    debit: z.array(z.object({
        account: z.string(),
        amount: z.number().int(),
        taxType: z.string().default('10%'),
    })).default([]),
    credit: z.array(z.object({
        account: z.string(),
        amount: z.number().int(),
        taxType: z.string().default('10%'),
    })).default([]),
})

// --- API Routes ---
const routes = app
    .get('/api/hello', (c) => {
        return c.json({
            message: 'Hello form Hono!',
        })
    })
    .route('/api/conversion', conversionRoute)
    .route('/api/clients', clientsRoute)
    .route('/api/journal-status', journalStatusRoute)
    .route('/api/journal-entry', journalEntry)
    .route('/api/collection', collection)
    .route('/api/ai-rules', aiRules)
    .route('/api/admin', admin)
    .route('/api/worker', worker)
    .route('/api/ai', aiModels)
    .get('/api/tax-options', (c) => {
        const rawData = [
            { label: '課税売上 10%', value: 'tax_10', rate: 0.1, code: '110' },
            { label: '非課税', value: 'tax_free', rate: 0, code: '999' },
        ]
        const validatedData = z.array(TaxOptionSchema).parse(rawData)
        return c.json(validatedData)
    })
    .post(
        '/api/journal',
        zValidator('json', JournalDataSchema, (result, c) => {
            if (!result.success) {
                return c.json({ success: false, message: 'Invalid data', errors: result.error }, 400)
            }
        }),
        (c) => {
            const data = c.req.valid('json')
            // Save to DB...
            return c.json({ success: true, id: data.id })
        }
    )

export default app
export type AppType = typeof routes
