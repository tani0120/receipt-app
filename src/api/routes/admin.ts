
import { Hono } from 'hono'
import { z } from 'zod'

import { zValidator } from '@hono/zod-validator'

const app = new Hono()

// --- Config Schemas ---
const PhaseConfigSchema = z.object({
    provider: z.enum(['vertex_ai', 'ai_studio', 'gemini', 'vertex']),
    mode: z.enum(['realtime', 'batch', 'normal']),
    model: z.string().optional(),
    modelName: z.string().optional()
})

const PhaseSettingsSchema = z.object({
    ocr: PhaseConfigSchema,
    learning: PhaseConfigSchema,
    conversion: PhaseConfigSchema,
    optimization: PhaseConfigSchema
})


// --- Mock Data ---
const MOCK_ADMIN_DATA = {
    kpi: {
        monthlyJournals: 12580,
        autoConversionRate: 94.2,
        aiAccuracy: 98.5,
        funnel: {
            received: 15400,
            exported: 13552
        }
    },
    staff: [
        { name: '佐藤 健太', backlogs: { total: 45, draft: 12 }, velocity: { draftAvg: 85 } },
        { name: '鈴木 一郎', backlogs: { total: 12, draft: 0 }, velocity: { draftAvg: 110 } },
        { name: '高橋 花子', backlogs: { total: 8, draft: 2 }, velocity: { draftAvg: 95 } }
    ]
}

// --- Routes ---
const route = app
    .get('/dashboard', (c) => {
        return c.json(MOCK_ADMIN_DATA)
    })
    .get('/config', async (c) => {
        // [レガシー] Firebase Firestore依存。Supabase移行後に再実装
        console.warn('[admin] config GET: Firebase削除済み。スタブレスポンスを返します')
        return c.json({})
    })
    .patch('/config',
        zValidator('json', z.object({
            aiPhases: PhaseSettingsSchema.optional(),
        }).passthrough(), async (result, c) => {
            if (!result.success) {
                return c.json({ success: false, message: 'Invalid config format', errors: result.error }, 400)
            }
            return undefined
        }),
        async (c) => {
            // [レガシー] Firebase Firestore + ConfigService依存。Supabase移行後に再実装
            console.warn('[admin] config PATCH: Firebase削除済み。保存はスキップされます')
            return c.json({ success: true, message: 'Configuration save skipped (Firebase removed)' })
        }
    )

export default route
