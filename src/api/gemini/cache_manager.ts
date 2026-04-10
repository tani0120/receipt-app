/**
 * Context Cache 管理ロジック（@google/genai SDK版）
 *
 * Gemini Context Cachingを使用したマスタデータの効率的な管理
 * - TTL: 1時間
 * - Cache再利用
 * - 有効期限チェック
 */

import type { CachedContentInfo, CacheConfig } from '@/types/GeminiOCR.types';
import { SYSTEM_INSTRUCTION } from './system_instruction';
import { GoogleGenAI } from '@google/genai';
import { readFileSync } from 'fs';

/**
 * Cache DB（仮実装）
 */
const cacheDB: Map<string, CachedContentInfo> = new Map();

/**
 * Cacheキー生成
 */
function generateCacheKey(config: CacheConfig): string {
    return `${config.client_id}:${config.master_file_path}`;
}

/**
 * Context Cacheを取得または作成
 */
export async function getOrCreateCache(config: CacheConfig): Promise<CachedContentInfo> {
    const now = new Date();
    const cacheKey = generateCacheKey(config);
    const existingCache = cacheDB.get(cacheKey);

    // 既存Cacheの有効性確認
    if (existingCache && existingCache.expire_time > now) {
        console.log(`✅ Cache Hit: ${cacheKey}`);
        return existingCache;
    }

    if (existingCache) {
        console.log(`⚠️ Cache Expired: ${cacheKey} - 再作成します`);
    } else {
        console.log(`🚀 Cache Miss: ${cacheKey} - 新規作成します`);
    }

    // マスタファイル読み込み
    const masterText = readFileSync(config.master_file_path, 'utf-8');

    // Context Cache作成
    const cacheInfo = await createContextCache(
        config.client_id,
        masterText,
        config.ttl_seconds
    );

    cacheDB.set(cacheKey, cacheInfo);

    return cacheInfo;
}

/**
 * Context Cacheを作成（@google/genai SDK版）
 */
async function createContextCache(
    clientId: string,
    masterText: string,
    ttlSeconds: number
): Promise<CachedContentInfo> {
    const API_KEY = process.env.GEMINI_API_KEY ?? process.env.VITE_GEMINI_API_KEY;

    if (!API_KEY) {
        throw new Error('GEMINI_API_KEY または VITE_GEMINI_API_KEY が設定されていません');
    }

    const ai = new GoogleGenAI({ apiKey: API_KEY });

    try {
        const cache = await ai.caches.create({
            model: 'gemini-2.5-flash',
            config: {
                displayName: `audit_master_${clientId}`,
                systemInstruction: SYSTEM_INSTRUCTION,
                contents: [
                    {
                        role: 'user',
                        parts: [{ text: masterText }]
                    }
                ],
                ttl: `${ttlSeconds}s`,
            },
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
 */
export function invalidateCache(clientId: string, masterFilePath?: string): void {
    if (masterFilePath) {
        const cacheKey = `${clientId}:${masterFilePath}`;
        const deleted = cacheDB.delete(cacheKey);
        if (deleted) {
            console.log(`🗑️ Cache Deleted: ${cacheKey}`);
        } else {
            console.log(`⚠️ Cache Not Found: ${cacheKey}`);
        }
    } else {
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
 * 全Cacheの状態確認（デバッグ用）
 */
export function getCacheStatus(): Map<string, CachedContentInfo> {
    return new Map(cacheDB);
}
