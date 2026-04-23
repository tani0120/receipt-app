import { Hono } from 'hono'
import { apiError, apiCatchError } from '../helpers/apiError'
import { 仕訳必須 } from '../helpers/apiMessages'
import { z } from 'zod'
import { documentRepository } from '../../database/repositories/documentRepository'

const app = new Hono()

// Zodスキーマ（リクエストバリデーション）
const UpdateStatusSchema = z.object({
    newStatus: z.enum(['uploaded', 'preprocessed', 'ocr_done', 'suggested', 'reviewing', 'confirmed', 'rejected']),
    actor: z.string().email().optional().default('system@receipt-app.com'),
    journal: z.any().optional() // confirmed時は必須（Repository層でチェック）
})

// POST /api/documents/:id/status
// 状態変更API（Supabase書き込み）
app.post('/:id/status', async (c) => {
    try {
        const documentId = c.req.param('id')
        console.log(`[API START] POST /documents/${documentId}/status`)

        const body = await c.req.json()
        console.log('[API] Request body:', JSON.stringify(body))

        // バリデーション
        const validated = UpdateStatusSchema.parse(body)

        // Supabase: 正規帳簿更新（SQL function使用）
        console.log('[API] Starting Supabase operation...')
        if (validated.newStatus === 'confirmed') {
            // confirmed時はjournal必須
            if (!validated.journal) {
                return apiError(c, 400, 仕訳必須)
            }

            console.log('[API] Calling confirmDocument...')
            await documentRepository.confirmDocument(documentId, validated.journal, validated.actor)
        } else {
            // 通常の状態変更
            console.log(`[API] Calling updateStatus with status: ${validated.newStatus}...`)
            await documentRepository.updateStatus(documentId, validated.newStatus, validated.actor)
        }
        console.log('[API] Supabase operation completed')

        // 成功レスポンス
        return c.json({
            success: true,
            documentId,
            newStatus: validated.newStatus,
            message: 'Status updated in Supabase'
        })

    } catch (e: unknown) {
        console.error('[API Error] documents/:id/status:', e)
        return apiCatchError(c, e)
    }
})

export default app
