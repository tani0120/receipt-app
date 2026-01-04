
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import conversionRoute from './routes/conversion'
import clientsRoute from './routes/clients'
import journalStatusRoute from './routes/journal-status'

const app = new Hono()

// Enable CORS for all routes (necessary when frontend (5173) calls backend (3000))
app.use('/*', cors())

// --- Data Models ---
const TaxOptionSchema = z.object({
    label: z.string(),
    value: z.string(),
    rate: z.number().default(0.1),
    code: z.string().default('unknown'),
})

const JournalDataSchema = z.object({
    id: z.string(),
    date: z.string().default(new Date().toISOString().split('T')[0] || ''),
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
    .route('/api/conversion', conversionRoute) // Mount data conversion route
    .route('/api/clients', clientsRoute) // Mount Clients BFF
    .route('/api/journal-status', journalStatusRoute) // Mount Journal Status BFF (Screen B)
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
