/**
 * Storage Service（環境変数で Supabase / ローカル切り替え）
 *
 * 【切り替え方式】
 * - USE_SUPABASE_MIGRATION=true: Supabase Storage API
 * - USE_SUPABASE_MIGRATION未設定（デフォルト）: data/storage/ にローカル保存
 *
 * 呼び出し側は StorageService.uploadImage() 等をそのまま使用。変更不要。
 *
 * 【移行履歴】
 * 2026-04-18: Firebase Storage → Supabase Storage に完全移行
 * 2026-04-21: ローカルStorage版追加（dev/test用。interface + ファクトリ方式）
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync } from 'fs'
import { join, dirname } from 'path'

// ===== Storage Provider Interface =====

interface StorageProvider {
    uploadImage(buffer: Buffer, path: string, mimeType: string): Promise<string>
    getSignedUrl(storagePath: string): Promise<string>
    downloadFile(storagePath: string): Promise<Buffer>
    deleteFile(storagePath: string): Promise<void>
}

// ===== Supabase版 =====

const BUCKET_NAME = 'receipts'

function createSupabaseProvider(): StorageProvider {
    function getServerSupabase() {
        const url = process.env.SUPABASE_URL
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY
        if (!url || !key) {
            throw new Error('[StorageService] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY が未設定です')
        }
        return createClient(url, key)
    }

    return {
        async uploadImage(buffer, path, mimeType) {
            const supabase = getServerSupabase()
            const { error } = await supabase.storage
                .from(BUCKET_NAME)
                .upload(path, buffer, {
                    contentType: mimeType,
                    cacheControl: 'public, max-age=31536000',
                    upsert: true,
                })
            if (error) throw new Error(`[StorageService] アップロード失敗: ${error.message}`)
            return `${BUCKET_NAME}/${path}`
        },

        async getSignedUrl(storagePath) {
            const supabase = getServerSupabase()
            const parts = storagePath.split('/')
            const bucket = parts[0]
            const filePath = parts.slice(1).join('/')
            if (!bucket || !filePath) throw new Error(`[StorageService] 不正なパス: ${storagePath}`)

            const { data, error } = await supabase.storage
                .from(bucket)
                .createSignedUrl(filePath, 3600)
            if (error) throw new Error(`[StorageService] 署名付きURL生成失敗: ${error.message}`)
            return data.signedUrl
        },

        async downloadFile(storagePath) {
            const supabase = getServerSupabase()
            const { data, error } = await supabase.storage
                .from(BUCKET_NAME)
                .download(storagePath)
            if (error) throw new Error(`[StorageService] ダウンロード失敗: ${error.message}`)
            const arrayBuffer = await data.arrayBuffer()
            return Buffer.from(arrayBuffer)
        },

        async deleteFile(storagePath) {
            const supabase = getServerSupabase()
            const { error } = await supabase.storage
                .from(BUCKET_NAME)
                .remove([storagePath])
            if (error) throw new Error(`[StorageService] 削除失敗: ${error.message}`)
        },
    }
}

// ===== ローカルファイル版（dev/test用） =====

const LOCAL_STORAGE_DIR = join(process.cwd(), 'data', 'storage')

function createLocalProvider(): StorageProvider {
    function resolvePath(storagePath: string): string {
        return join(LOCAL_STORAGE_DIR, storagePath)
    }

    function ensureDir(filePath: string): void {
        const dir = dirname(filePath)
        if (!existsSync(dir)) {
            mkdirSync(dir, { recursive: true })
        }
    }

    return {
        async uploadImage(buffer, path, _mimeType) {
            const fullPath = resolvePath(path)
            ensureDir(fullPath)
            writeFileSync(fullPath, buffer)
            console.log(`[StorageService/local] 保存: ${fullPath} (${buffer.byteLength} bytes)`)
            return `${BUCKET_NAME}/${path}`
        },

        async getSignedUrl(storagePath) {
            // ローカルではファイルパスをそのまま返す（APIサーバー経由で配信）
            const parts = storagePath.split('/')
            const filePath = parts.slice(1).join('/')
            const fullPath = resolvePath(filePath)
            if (!existsSync(fullPath)) {
                throw new Error(`[StorageService/local] ファイルが見つかりません: ${fullPath}`)
            }
            return `/api/local-storage/${filePath}`
        },

        async downloadFile(storagePath) {
            const fullPath = resolvePath(storagePath)
            if (!existsSync(fullPath)) {
                throw new Error(`[StorageService/local] ファイルが見つかりません: ${fullPath}`)
            }
            return readFileSync(fullPath)
        },

        async deleteFile(storagePath) {
            const fullPath = resolvePath(storagePath)
            if (existsSync(fullPath)) {
                unlinkSync(fullPath)
                console.log(`[StorageService/local] 削除: ${fullPath}`)
            }
        },
    }
}

// ===== ファクトリ =====

let _provider: StorageProvider | null = null

function getProvider(): StorageProvider {
    if (_provider) return _provider

    const useSupabase = process.env.USE_SUPABASE_MIGRATION === 'true'

    if (useSupabase) {
        _provider = createSupabaseProvider()
    } else {
        _provider = createLocalProvider()
    }

    console.log(`[StorageService] ${useSupabase ? 'Supabase' : 'ローカル'}版を使用`)
    return _provider
}

// ===== 公開クラス（既存APIを維持。呼び出し側変更不要） =====

export class StorageService {
    static async uploadImage(buffer: Buffer, path: string, mimeType: string): Promise<string> {
        return getProvider().uploadImage(buffer, path, mimeType)
    }

    static async getSignedUrl(storagePath: string): Promise<string> {
        return getProvider().getSignedUrl(storagePath)
    }

    static async downloadFile(storagePath: string): Promise<Buffer> {
        return getProvider().downloadFile(storagePath)
    }

    static async deleteFile(storagePath: string): Promise<void> {
        return getProvider().deleteFile(storagePath)
    }
}
