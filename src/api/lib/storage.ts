/**
 * Storage Service（Supabase Storage版）
 *
 * Firebase Storage から Supabase Storage に移行。
 * バケット名: receipts（Supabaseダッシュボードで事前作成が必要）
 *
 * 【移行履歴】
 * 2026-04-18: Firebase Storage → Supabase Storage に完全移行
 */

import { createClient } from '@supabase/supabase-js'

/** サーバー側Supabaseクライアント（service_role使用） */
function getServerSupabase() {
    const url = process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) {
        throw new Error('[StorageService] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY が未設定です')
    }
    return createClient(url, key)
}

const BUCKET_NAME = 'receipts'

export class StorageService {
    /**
     * ファイルをSupabase Storageにアップロードし、パスを返す
     */
    static async uploadImage(buffer: Buffer, path: string, mimeType: string): Promise<string> {
        const supabase = getServerSupabase()

        const { error } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(path, buffer, {
                contentType: mimeType,
                cacheControl: 'public, max-age=31536000',
                upsert: true,
            })

        if (error) {
            throw new Error(`[StorageService] アップロード失敗: ${error.message}`)
        }

        // Supabase Storageのパス形式で返す
        return `${BUCKET_NAME}/${path}`
    }

    /**
     * 署名付きURLを生成（1時間有効）
     */
    static async getSignedUrl(storagePath: string): Promise<string> {
        const supabase = getServerSupabase()

        // storagePath = "receipts/path/to/file.jpg" → bucket="receipts", path="path/to/file.jpg"
        const parts = storagePath.split('/')
        const bucket = parts[0]
        const filePath = parts.slice(1).join('/')

        if (!bucket || !filePath) {
            throw new Error(`[StorageService] 不正なパス: ${storagePath}`)
        }

        const { data, error } = await supabase.storage
            .from(bucket)
            .createSignedUrl(filePath, 3600) // 1時間

        if (error) {
            throw new Error(`[StorageService] 署名付きURL生成失敗: ${error.message}`)
        }

        return data.signedUrl
    }
}
