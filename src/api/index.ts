
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
import admin from './routes/admin'
import worker from './routes/worker'
import aiModels from './routes/ai-models'
import jobs from './routes/jobs'

const app = new Hono()

// ... (Existing middleware)

// --- Data Models ---
const TaxOptionSchema = z.object({
    label: z.string(),
    value: z.string(),
    rate: z.number().default(0.1),
    code: z.string().default('unknown'),
})

const JournalDataSchema = z.object({}).passthrough()

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
    .route('/api/jobs', jobs) // Register Jobs Route
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
