import { Hono } from 'hono'
import { z } from 'zod'
import { receiptRepository } from '../../database/repositories/receiptRepository'
import admin from 'firebase-admin'

const app = new Hono()

// Zod Schema for request validation
const UpdateStatusSchema = z.object({
    newStatus: z.enum(['uploaded', 'preprocessed', 'ocr_done', 'suggested', 'reviewing', 'confirmed', 'rejected']),
    actor: z.string().email().optional().default('system@receipt-app.com'),
    journal: z.any().optional() // confirmed時は必須（Repository層でチェック）
})

// POST /api/receipts/:id/status
// 状態変更API（Firestore + Supabase両方書き込み）
app.post('/:id/status', async (c) => {
    try {
        const receiptId = c.req.param('id')
        console.log(`[API START] POST /receipts/${receiptId}/status`)

        const body = await c.req.json()
        console.log('[API] Request body:', JSON.stringify(body))

        // バリデーション
        const validated = UpdateStatusSchema.parse(body)

        // 1. Firestore: イベントログ記録（環境変数で制御）
        const ENABLE_FIRESTORE = process.env.ENABLE_FIRESTORE === 'true'

        if (ENABLE_FIRESTORE) {
            const db = admin.firestore()
            await db.collection('receipt_events').add({
                receiptId,
                eventType: 'status_change',
                newStatus: validated.newStatus,
                actor: validated.actor,
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            })
            console.log(`[Firestore] Event logged: ${receiptId} -> ${validated.newStatus}`)
        } else {
            console.log('[API] Firestore disabled, skipping event log')
        }

        // 2. Supabase: 正規帳簿更新（SQL function使用）
        console.log('[API] Starting Supabase operation...')
        if (validated.newStatus === 'confirmed') {
            // confirmed時はjournal必須
            if (!validated.journal) {
                return c.json({ error: 'journal is required for confirmed status' }, 400)
            }

            console.log('[API] Calling confirmReceipt...')
            await receiptRepository.confirmReceipt(receiptId, validated.journal, validated.actor)
        } else {
            // 通常の状態変更
            console.log(`[API] Calling updateStatus with status: ${validated.newStatus}...`)
            await receiptRepository.updateStatus(receiptId, validated.newStatus, validated.actor)
        }
        console.log('[API] Supabase operation completed')

        // 3. 成功レスポンス
        return c.json({
            success: true,
            receiptId,
            newStatus: validated.newStatus,
            message: 'Status updated in both Firestore and Supabase'
        })

    } catch (e: unknown) {
        console.error('[API Error] receipts/:id/status:', e)
        const errorMessage = e instanceof Error ? e.message : 'Unknown error'
        return c.json({ error: errorMessage }, 500)
    }
})

export default app
