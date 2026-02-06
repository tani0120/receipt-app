/**
 * Vertex AI Context Cache Manager
 *
 * Vertex AI用のContext Cache管理ロジック
 * - TTL: 1時間
 * - Cache再利用
 * - System InstructionをCache内に含める
 *
 * Phase 6.2のcache_manager.tsとの差異:
 * - Gemini API: GoogleAICacheManager
 * - Vertex AI: VertexAI.preview.cachedContents
 */

import { VertexAI } from '@google-cloud/vertexai';
import { SYSTEM_INSTRUCTION } from '../gemini/system_instruction';

/**
 * Cache設定
 */
export interface CacheConfig {
    client_id: string;
    master_file_path: string;
    projectId: string;
    location: string;
    model_name: string;  // 追加: 使用モデル名
}

/**
 * Cache情報（Vertex AI専用）
 *
 * ⚠ Vertex AI Note:
 * cachedContents.create() does NOT return a cachedContent object.
 * Only a resource name string is returned.
 */
export interface VertexCacheInfo {
    cacheName: string;
    createTime?: string;
    expireTime?: string;
}

/**
 * Cache DB（仮実装）
 *
 * Phase 6.3: ローカルメモリ
 * Phase 6.4以降: Firestore or Redis
 */
const cacheDB: Map<string, VertexCacheInfo> = new Map();

/**
 * Cacheキー生成
 *
 * client_id:master_file_path 形式
 * 将来の事故防止（会計年度変更、マスタ更新、A/Bテスト対応）
 *
 * @param config - Cache設定
 * @returns Cacheキー
 */
function generateCacheKey(config: CacheConfig): string {
    return `${config.client_id}:${config.master_file_path}:${config.model_name}`;  // モデル名をキーに含める
}

/**
 * Context Cacheを取得または作成
 *
 * 1. 既存Cacheの有効性確認
 * 2. 有効ならCache再利用
 * 3. 無効なら新規作成
 *
 * @param config - Cache設定
 * @returns Cache名（Vertex AIのCached Content名）
 */
export async function getOrCreateCache(config: CacheConfig): Promise<VertexCacheInfo> {
    const cacheKey = generateCacheKey(config);

    console.log(`[Cache] キー: ${cacheKey}`);

    // 既存Cacheの確認
    const existing = cacheDB.get(cacheKey);
    if (existing && isCacheValid(existing)) {
        console.log(`[Cache] ✅ 再利用: ${existing.cacheName}`);
        return existing;
    }

    // 新規Cache作成
    console.log(`[Cache] 🆕 新規作成中...`);
    const newCache = await createCache(config);
    cacheDB.set(cacheKey, newCache);

    console.log(`[Cache] ✅ 作成完了: ${newCache.cacheName}`);
    return newCache;
}

/**
 * Cacheの有効性確認
 *
 * 有効期限内かチェック
 *
 * @param cache - Cache情報
 * @returns 有効ならtrue
 */
function isCacheValid(cache: VertexCacheInfo): boolean {
    if (!cache.expireTime) return false;
    const now = new Date();
    const expireTime = new Date(cache.expireTime);

    return now < expireTime;
}

/**
 * Context Cache作成（Vertex AI版）
 *
 * System InstructionをCache内に含める
 *
 * @param config - Cache設定
 * @returns Cache情報
 */
async function createCache(config: CacheConfig): Promise<VertexCacheInfo> {
    const vertexAI = new VertexAI({
        project: config.projectId,
        location: config.location
    });

    // マスタデータ読み込み（Phase 6.3では仮実装）
    const masterData = await loadMasterData(config.master_file_path);

    // Cache作成
    const cacheResult = await vertexAI.preview.cachedContents.create({
        model: config.model_name,  // パラメータ化
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
        systemInstruction: {
            role: 'system',
            parts: [
                {
                    text: SYSTEM_INSTRUCTION
                }
            ]
        },
        ttl: '3600s', // 1時間（Vertex AIは "3600s" 形式）
        displayName: `cache_${config.client_id}`
    });

    if (!cacheResult.name) {
        throw new Error('Cache creation failed: name is undefined');
    }

    return {
        cacheName: cacheResult.name,
        createTime: cacheResult.createTime,
        expireTime: cacheResult.expireTime
    };
}

/**
 * マスタデータ読み込み（仮実装）
 *
 * Phase 6.3: 固定テキスト
 * Phase 6.4以降: Firestore or CSVファイル
 *
 * @param masterFilePath - マスタファイルパス
 * @returns マスタデータ（テキスト）
 */
async function loadMasterData(_masterFilePath: string): Promise<string> {
    // Phase 6.3: 仮実装（固定データ）
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
 *
 * @param cacheKey - Cacheキー
 */
export function clearCache(cacheKey: string): void {
    cacheDB.delete(cacheKey);
    console.log(`[Cache] 🗑️ 削除: ${cacheKey}`);
}
