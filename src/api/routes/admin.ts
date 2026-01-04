
import { Hono } from 'hono'
import { z } from 'zod'

const app = new Hono()

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

export default route
