/**
 * Vertex AI Context Cache Manager（@google/genai SDK版）
 *
 * Vertex AI用のContext Cache管理ロジック
 * - TTL: 1時間
 * - Cache再利用
 * - System InstructionをCache内に含める
 */

import { GoogleGenAI } from '@google/genai';
import { SYSTEM_INSTRUCTION } from '../gemini/system_instruction';

/**
 * Cache設定
 */
export interface CacheConfig {
    client_id: string;
    master_file_path: string;
    projectId: string;
    location: string;
    model_name: string;
}

/**
 * Cache情報（Vertex AI専用）
 */
export interface VertexCacheInfo {
    cacheName: string;
    createTime?: string;
    expireTime?: string;
}

/**
 * Cache DB（仮実装）
 */
const cacheDB: Map<string, VertexCacheInfo> = new Map();

/**
 * Cacheキー生成
 */
function generateCacheKey(config: CacheConfig): string {
    return `${config.client_id}:${config.master_file_path}:${config.model_name}`;
}

/**
 * Context Cacheを取得または作成
 */
export async function getOrCreateCache(config: CacheConfig): Promise<VertexCacheInfo> {
    const cacheKey = generateCacheKey(config);

    console.log(`[Cache] キー: ${cacheKey}`);

    const existing = cacheDB.get(cacheKey);
    if (existing && isCacheValid(existing)) {
        console.log(`[Cache] ✅ 再利用: ${existing.cacheName}`);
        return existing;
    }

    console.log(`[Cache] 🆕 新規作成中...`);
    const newCache = await createCache(config);
    cacheDB.set(cacheKey, newCache);

    console.log(`[Cache] ✅ 作成完了: ${newCache.cacheName}`);
    return newCache;
}

/**
 * Cacheの有効性確認
 */
function isCacheValid(cache: VertexCacheInfo): boolean {
    if (!cache.expireTime) return false;
    const now = new Date();
    const expireTime = new Date(cache.expireTime);

    return now < expireTime;
}

/**
 * Context Cache作成（@google/genai SDK版・Vertex AI）
 */
async function createCache(config: CacheConfig): Promise<VertexCacheInfo> {
    const ai = new GoogleGenAI({
        vertexai: true,
        project: config.projectId,
        location: config.location,
    });

    // マスタデータ読み込み（Phase 6.3では仮実装）
    const masterData = await loadMasterData(config.master_file_path);

    const cacheResult = await ai.caches.create({
        model: config.model_name,
        config: {
            displayName: `cache_${config.client_id}`,
            contents: [
                {
                    role: 'user',
                    parts: [
                        {
                            text: `# マスタデータ\n\n${masterData}`
                        }
                    ]
                }
            ],
            systemInstruction: SYSTEM_INSTRUCTION,
            ttl: '3600s',
        },
    });

    if (!cacheResult.name) {
        throw new Error('Cache creation failed: name is undefined');
    }

    return {
        cacheName: cacheResult.name,
        createTime: cacheResult.createTime,
        expireTime: cacheResult.expireTime,
    };
}

/**
 * マスタデータ読み込み（仮実装）
 */
async function loadMasterData(_masterFilePath: string): Promise<string> {
    return `
## 顧問先基本情報
- 会社名: テスト株式会社
- 会計期間: 2025-04-01 ～ 2026-03-31
- 会計ソフト: freee
- 消費税率: 10% (軽減税率8%)

## 勘定科目リスト
| 科目ID | 科目名 | 税区分 |
|--------|--------|--------|
| 001 | 接待交際費 | 課税仕入10% |
| 002 | 会議費 | 課税仕入10% |
| 003 | 飲食費 | 課税仕入10% |
| 004 | 外食費 | 課税仕入10% |
| 005 | 福利厚生費 | 課税仕入10% |
| 006 | 仮払金 | 対象外 |

## T番号マスタ
| T番号 | 店名 | 科目ID |
|--------|--------|--------|
| T1234567890123 | まんがい天満橋店 | 001 |
| T9876543210987 | スターバックス | 002 |

## 特殊仕訳ルール
- 金額 ≥ 10,000円 かつ 飲食費 → 接待交際費
- 複数名での飲食 → 接待交際費
- 個人の軽食 → 飲食費
`;
}

/**
 * Cache削除（デバッグ用）
 */
export function clearCache(cacheKey: string): void {
    cacheDB.delete(cacheKey);
    console.log(`[Cache] 🗑️ 削除: ${cacheKey}`);
}
