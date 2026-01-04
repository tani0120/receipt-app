
import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'

const app = new Hono()

// --- Data Models (Shared, ideally moved to a separate file later) ---
const TaxOptionSchema = z.object({
    label: z.string(),
    value: z.string(),
    rate: z.number().default(0.1), // Fallback: default to 10%
    code: z.string().default('unknown'), // Fallback: default code
})

const JournalDataSchema = z.object({
    id: z.string(),
    date: z.string().default(() => new Date().toISOString().split('T')[0]),
    debit: z.array(z.object({
        account: z.string(),
        amount: z.number().int(),
        taxType: z.string().default('10%'), // Fallback
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
    .get('/api/tax-options', (c) => {
        // Mock data source (usually from DB)
        // Here we ensure data strictly follows schema before sending
        const rawData = [
            { label: '課税売上 10%', value: 'tax_10', rate: 0.1, code: '110' },
            { label: '非課税', value: 'tax_free', rate: 0, code: '999' },
        ]

        // Validate output with Zod to guarantee shape to frontend
        const validatedData = z.array(TaxOptionSchema).parse(rawData)
        return c.json(validatedData)
    })
    .post(
        '/api/journal',
        zValidator('json', JournalDataSchema, (result, c) => {
            if (!result.success) {
                // Fallback strategy on ERROR:
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
