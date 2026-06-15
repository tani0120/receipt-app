
import { Hono } from 'hono'
import conversionRoute from './routes/conversion'
import clientsRoute from './routes/clientRoutes'

import collection from './routes/collection'
import commentRoutes from './routes/commentRoutes'
import attachmentRoutes from './routes/attachmentRoutes'
// 旧ai-rulesは廃止・削除済み
import admin from './routes/admin'
import aiModels from './routes/ai-models'

import activityLog from './routes/activityLogRoutes'
import accountMaster from './routes/accountMasterRoutes'
import taxCategory from './routes/taxCategoryRoutes'
import vendorRoutes from './routes/vendorRoutes'
import industryVectorRoutes from './routes/industryVectorRoutes'
import staffRoutes from './routes/staffRoutes'
import authRoutes from './routes/authRoutes'
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
import learningRuleRoutes from './routes/learningRuleRoutes'
import progressRoutes from './routes/progressRoutes'
import mfAuthRoutes from './routes/mfAuthRoutes'
import mfRoutes from './routes/mfRoutes'
import { exportRoutes } from './routes/exportRoutes'
import aiCommandRoutes from './routes/aiCommandRoutes'
import { TAX_OPTIONS } from '../shared/schema_dictionary'

const app = new Hono()

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
    .route('/api/collection', collection)
    // 旧ai-rulesは廃止・削除済み
    .route('/api/admin', admin)
    .route('/api/ai', aiModels)
    .route('/api/activity-log', activityLog)
    .route('/api/accounts', accountMaster)
    .route('/api/tax-categories', taxCategory)
    .route('/api/vendors', vendorRoutes)
    .route('/api/industry-vectors', industryVectorRoutes)
    .route('/api/staff', staffRoutes)
    .route('/api/auth', authRoutes)
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
    .route('/api/learning-rules', learningRuleRoutes)
    .route('/api/progress', progressRoutes)
    .route('/api/export', exportRoutes)
    .route('/api/comments', commentRoutes)
    .route('/api/attachments', attachmentRoutes)
    .route('/api/mf', mfAuthRoutes)
    .route('/api/mf', mfRoutes)
    .get('/api/tax-options', (c) => {
        return c.json(TAX_OPTIONS)
    })

// チェーン外で登録（Honoのチェーン長によるルート脱落防止）
app.route('/api/ai-command', aiCommandRoutes)

export default app
export type AppType = typeof routes
