/**
 * Context Cache 管理ロジック（改善反映版 + 実API実装）
 *
 * Gemini Context Cachingを使用したマスタデータの効率的な管理
 * - TTL: 1時間
 * - Cache再利用
 * - 有効期限チェック
 *
 * 改善ポイント:
 * ① GEMINI_API_KEY 統一（フォールバック対応）
 * ② systemInstruction をCache作成時に付与
 * ③ Cacheキーを client_id:master_file_path に変更（将来事故防止）
 */

import type { CachedContentInfo, CacheConfig } from '@/types/GeminiOCR.types';
import { SYSTEM_INSTRUCTION } from './system_instruction';
import { GoogleAICacheManager } from '@google/generative-ai/server';
import { readFileSync } from 'fs';

/**
 * Cache DB（仮実装）
 *
 * Phase 6.2-A: ローカルメモリ
 * Phase 6.3以降: Firestore or Redis
 */
const cacheDB: Map<string, CachedContentInfo> = new Map();

/**
 * Cacheキー生成（改善③：将来事故防止）
 *
 * client_id 単独ではなく、master_file_path も含める
 * - 会計年度が変わる
 * - マスタ更新
 * - A/Bテスト
 * これらのケースで異なるCacheが必要になるため
 *
 * @param config - Cache設定
 * @returns Cacheキー
 */
function generateCacheKey(config: CacheConfig): string {
    return `${config.client_id}:${config.master_file_path}`;
}

/**
 * Context Cacheを取得または作成
 *
 * 1. 既存Cacheの有効性確認
 * 2. 有効ならCache再利用
 * 3. 無効なら新規作成
 *
 * @param config - Cache設定
 * @returns CachedContentInfo
 */
export async function getOrCreateCache(config: CacheConfig): Promise<CachedContentInfo> {
    const now = new Date();
    const cacheKey = generateCacheKey(config); // 改善③
    const existingCache = cacheDB.get(cacheKey);

    // 既存Cacheの有効性確認
    if (existingCache && existingCache.expire_time > now) {
        console.log(`✅ Cache Hit: ${cacheKey}`);
        return existingCache;
    }

    // 既存Cacheが期限切れの場合
    if (existingCache) {
        console.log(`⚠️ Cache Expired: ${cacheKey} - 再作成します`);
    } else {
        console.log(`🚀 Cache Miss: ${cacheKey} - 新規作成します`);
    }

    // マスタファイル読み込み
    const masterText = readFileSync(config.master_file_path, 'utf-8');

    // Context Cache作成（Gemini API呼び出し）
    const cacheInfo = await createContextCache(
        config.client_id,
        masterText,
        config.ttl_seconds
    );

    // Cache DB更新
    cacheDB.set(cacheKey, cacheInfo); // 改善③

    return cacheInfo;
}

/**
 * Context Cacheを作成（Gemini API実装）
 *
 * 修正①: GEMINI_API_KEY統一（フォールバック対応）
 * 修正②: systemInstruction付与
 *
 * @param clientId - 顧問先ID
 * @param masterText - マスタデータテキスト
 * @param ttlSeconds - TTL（秒）
 * @returns CachedContentInfo
 */
async function createContextCache(
    clientId: string,
    masterText: string,
    ttlSeconds: number
): Promise<CachedContentInfo> {
    // 修正①: API Key取得（フォールバック対応）
    const API_KEY = process.env.GEMINI_API_KEY ?? process.env.VITE_GEMINI_API_KEY;

    if (!API_KEY) {
        throw new Error('GEMINI_API_KEY または VITE_GEMINI_API_KEY が設定されていません');
    }

    const cacheManager = new GoogleAICacheManager(API_KEY);

    try {
        // 修正②: systemInstruction付与
        const cache = await cacheManager.create({
            model: 'models/gemini-1.5-flash-001',
            displayName: `audit_master_${clientId}`,
            systemInstruction: SYSTEM_INSTRUCTION,
            contents: [
                {
                    role: 'user',
                    parts: [{ text: masterText }]
                }
            ],
            ttlSeconds: ttlSeconds
        });

        const expireTime = new Date(Date.now() + ttlSeconds * 1000);

        console.log(`✅ Context Cache作成完了: ${cache.name}`);

        if (!cache.name) {
            throw new Error('Cache name is undefined');
        }

        return {
            cache_name: cache.name,
            expire_time: expireTime
        };
    } catch (error) {
        console.error('❌ Context Cache作成失敗:', error);
        throw new Error(`Context Cache creation failed: ${error}`);
    }
}

/**
 * Cacheを手動削除
 *
 * マスタデータ更新時などに使用
 *
 * @param clientId - 顧問先ID
 * @param masterFilePath - マスタファイルパス（省略時は全削除）
 */
export function invalidateCache(clientId: string, masterFilePath?: string): void {
    if (masterFilePath) {
        // 特定のCacheのみ削除（改善③）
        const cacheKey = `${clientId}:${masterFilePath}`;
        const deleted = cacheDB.delete(cacheKey);
        if (deleted) {
            console.log(`🗑️ Cache Deleted: ${cacheKey}`);
        } else {
            console.log(`⚠️ Cache Not Found: ${cacheKey}`);
        }
    } else {
        // 顧問先IDに紐づく全Cache削除
        let deletedCount = 0;
        for (const key of cacheDB.keys()) {
            if (key.startsWith(`${clientId}:`)) {
                cacheDB.delete(key);
                deletedCount++;
            }
        }
        console.log(`🗑️ Cache Deleted: ${deletedCount} entries for ${clientId}`);
    }
}

/**
 * 全Cacheの状態確認
 *
 * デバッグ用
 */
export function getCacheStatus(): Map<string, CachedContentInfo> {
    return new Map(cacheDB);
}
