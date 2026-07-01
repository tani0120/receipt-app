/**
 * routeTree.ts — 全APIルートの唯一の定義（SSOT）
 *
 * 責務: 全ルートのチェーン定義 + AppType export
 *
 * 依存方向:
 *   routeTree.ts（ここ）
 *       ↑          ↑
 *   api/index.ts   server.ts
 *   （Vite開発用）  （本番用）
 *
 * ルール:
 *   - 新規ルート追加時はここに追加する（server.ts / api/index.ts には書かない）
 *   - ミドルウェア（requestId等）はserver.ts側で追加する
 */

import { Hono } from 'hono'
import { TAX_OPTIONS } from '../shared/schema_dictionary'

// --- ルートファイル import ---
import conversionRoute from './routes/conversion'
import clientsRoute from './routes/clientRoutes'
import collection from './routes/collection'
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
import commentRoutes from './routes/commentRoutes'
import attachmentRoutes from './routes/attachmentRoutes'
import aiCommandRoutes from './routes/aiCommandRoutes'
// server.tsのみに存在していたルート（api/index.tsに不足していた4件）
import leadRoutes from './routes/leadRoutes'
import fieldLayoutRoutes from './routes/fieldLayoutRoutes'
import listViewRoutes from './routes/listViewRoutes'
import aiPromptRoutes from './routes/aiPromptRoutes'

// --- ルートチェーン定義 ---
const app = new Hono()

// グループ1: 基盤・認証
const routes = app
    .get('/api/hello', (c) => {
        return c.json({ message: 'Hello from Hono!' })
    })
    .route('/api/auth', authRoutes)
    .route('/api/guest', guestAuthRoutes)
    .route('/api/staff', staffRoutes)
    // グループ2: 顧問先・見込先
    .route('/api/clients', clientsRoute)
    .route('/api/leads', leadRoutes)
    // グループ3: 仕訳・確定仕訳
    .route('/api/journals', journalRoutes)
    .route('/api/confirmed-journals', confirmedJournalRoutes)
    // グループ4: マスタ（科目・税区分・取引先・業種）
    .route('/api/accounts', accountMaster)
    .route('/api/tax-categories', taxCategory)
    .route('/api/vendors', vendorRoutes)
    .route('/api/industry-vectors', industryVectorRoutes)
    .route('/api/learning-rules', learningRuleRoutes)
    // グループ5: ドキュメント・ドライブ・添付
    .route('/api/documents', documents)
    .route('/api/doc-store', docStore)
    .route('/api/drive', drive)
    .route('/api/attachments', attachmentRoutes)
    // グループ6: UI・表示
    .route('/api/field-layout', fieldLayoutRoutes)
    .route('/api/list-views', listViewRoutes)
    .route('/api/comments', commentRoutes)
    .route('/api/notifications', notificationRoutes)
    .route('/api/share-status', shareStatusRoutes)
    .route('/api/activity-log', activityLog)
    .route('/api/progress', progressRoutes)
    // グループ7: 変換・出力・パイプライン
    .route('/api/conversion', conversionRoute)
    .route('/api/collection', collection)
    .route('/api/export', exportRoutes)
    .route('/api/export-history', exportHistoryRoutes)
    .route('/api/pipeline', pipeline)
    .route('/api/ocr', ocrRoute)
    // グループ8: MF連携
    .route('/api/mf', mfAuthRoutes)
    .route('/api/mf', mfRoutes)
    // グループ9: AI
    .route('/api/ai', aiModels)
    .route('/api/ai-command', aiCommandRoutes)
    .route('/api/ai-prompts', aiPromptRoutes)
    // グループ10: 管理
    .route('/api/admin', admin)
    .get('/api/tax-options', (c) => {
        return c.json(TAX_OPTIONS)
    })

export default routes
export type AppType = typeof routes
