
import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { zodHook } from './helpers/zodHook'
import conversionRoute from './routes/conversion'
import clientsRoute from './routes/clients'
import journalStatusRoute from './routes/journal-status'
import journalEntry from './routes/journal-entry'
import collection from './routes/collection'
// 旧ai-rulesは廃止・削除済み
import admin from './routes/admin'
import worker from './routes/worker'
import aiModels from './routes/ai-models'
import jobs from './routes/jobs'
import { TAX_OPTIONS } from '../shared/schema_dictionary'

const app = new Hono()

// ... (Existing middleware)

// --- Data Models ---
// --- Data Models ---
// TaxOptionSchema removed (Using Shared Constant)

const JournalDataSchema = z.object({}).passthrough()

// --- API Routes ---
// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
    // 旧ai-rulesは廃止・削除済み
    .route('/api/admin', admin)
    .route('/api/worker', worker)
    .route('/api/ai', aiModels)
    .get('/api/tax-options', (c) => {
        return c.json(TAX_OPTIONS)
    })
    .post(
        '/api/journal',
        zValidator('json', JournalDataSchema, zodHook),
        (c) => {
            const data = c.req.valid('json')
            // Save to DB...
            return c.json({ success: true, id: data.id })
        }
    )

export default app
export type AppType = typeof routes
