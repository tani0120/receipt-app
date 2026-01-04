
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

// --- Data Models ---
const DashboardKpiSchema = z.object({
    monthlyJournals: z.number(),
    autoConversionRate: z.number(),
    aiAccuracy: z.number(),
    funnel: z.object({
        received: z.number(),
        exported: z.number()
    })
})

const StaffPerformanceSchema = z.object({
    name: z.string(),
    backlogs: z.object({
        total: z.number(),
        draft: z.number()
    }),
    velocity: z.object({
        draftAvg: z.number()
    })
})

const AdminDashboardSchema = z.object({
    kpi: DashboardKpiSchema,
    staff: z.array(StaffPerformanceSchema)
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
        try {
            const { db } = await import('../lib/firebase')
            const doc = await db.collection('system_configs').doc('ai_phase_settings').get()
            const data = doc.data() || {}
            return c.json(data)
        } catch (e: any) {
            console.error('Failed to fetch config:', e)
            return c.json({}, 500)
        }
    })
    .patch('/config',
        zValidator('json', z.object({ aiPhases: PhaseSettingsSchema }).passthrough(), (result, c) => {
            if (!result.success) {
                return c.json({ success: false, message: 'Invalid config format', errors: result.error }, 400)
            }
        }),
        async (c) => {
            try {
                const { db } = await import('../lib/firebase')
                const payload = c.req.valid('json')

                const mapPhase = (p: any) => ({
                    provider: p.provider === 'gemini' ? 'ai_studio' : 'vertex_ai',
                    mode: p.mode === 'normal' ? 'realtime' : 'batch',
                    model: p.modelName || p.model
                })

                const docData = {
                    ocr: mapPhase(payload.aiPhases.ocr),
                    learning: mapPhase(payload.aiPhases.learning),
                    conversion: mapPhase(payload.aiPhases.conversion),
                    optimization: mapPhase(payload.aiPhases.optimization)
                }

                await db.collection('system_configs').doc('ai_phase_settings').set(docData, { merge: true })
                return c.json({ success: true, saved: docData })
            } catch (e: any) {
                console.error('Failed to save config:', e)
                return c.json({ success: false, error: e.message }, 500)
            }
        }
    )

export default route
