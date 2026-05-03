
import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { zodHook } from './helpers/zodHook'
import conversionRoute from './routes/conversion'
import clientsRoute from './routes/clientRoutes'
import journalStatusRoute from './routes/journal-status'
import journalEntry from './routes/journal-entry'
import collection from './routes/collection'
// 旧ai-rulesは廃止・削除済み
import admin from './routes/admin'
import worker from './routes/worker'
import aiModels from './routes/ai-models'
import jobs from './routes/jobs'
import activityLog from './routes/activityLogRoutes'
import accountMaster from './routes/accountMasterRoutes'
import taxCategory from './routes/taxCategoryRoutes'
import vendorRoutes from './routes/vendorRoutes'
import industryVectorRoutes from './routes/industryVectorRoutes'
import staffRoutes from './routes/staffRoutes'
import confirmedJournalRoutes from './routes/confirmedJournalRoutes'
import docStore from './routes/docStore'
import documents from './routes/documents'
import drive from './routes/drive'
import exportHistoryRoutes from './routes/exportHistoryRoutes'
import guestAuthRoutes from './routes/guestAuthRoutes'
import journalRoutes from './routes/journalRoutes'
import notificationRoutes from './routes/notificationRoutes'
import ocrRoute from './routes/ocr'
import pipeline from './routes/pipeline'
import shareStatusRoutes from './routes/shareStatusRoutes'
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
    .route('/api/activity-log', activityLog)
    .route('/api/accounts', accountMaster)
    .route('/api/tax-categories', taxCategory)
    .route('/api/vendors', vendorRoutes)
    .route('/api/industry-vectors', industryVectorRoutes)
    .route('/api/staff', staffRoutes)
    .route('/api/confirmed-journals', confirmedJournalRoutes)
    .route('/api/doc-store', docStore)
    .route('/api/documents', documents)
    .route('/api/drive', drive)
    .route('/api/export-history', exportHistoryRoutes)
    .route('/api/guest', guestAuthRoutes)
    .route('/api/journals', journalRoutes)
    .route('/api/notifications', notificationRoutes)
    .route('/api/ocr', ocrRoute)
    .route('/api/pipeline', pipeline)
    .route('/api/share-status', shareStatusRoutes)
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
