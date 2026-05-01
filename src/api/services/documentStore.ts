/**
 * documentStore.ts — ドキュメントJSON永続化ストア
 *
 * 【設計原則】
 * - サーバー側のインメモリ + JSONファイル永続化
 * - 起動時にJSONから読み込み、更新時にJSONに書き出し
 * - Supabase移行時にDB操作に差し替え
 * - 型はrepositories/types.tsから一元参照（二重定義禁止）
 *
 * 【ファイル場所】
 * - data/documents.json（.gitignoreに追加済み）
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import type { DocEntry } from '../../repositories/types';
import { AI_FIELD_KEYS } from '../../repositories/types';
import type { PreviewExtractResponse } from '../services/pipeline/types';

const DATA_DIR = join(process.cwd(), 'data');
const DATA_FILE = join(DATA_DIR, 'documents.json');

// インメモリストア
let documents: DocEntry[] = [];

/**
 * 起動時にJSONから読み込み
 */
export function loadDocuments(): void {
  try {
    if (existsSync(DATA_FILE)) {
      const raw = readFileSync(DATA_FILE, 'utf-8');
      documents = JSON.parse(raw) as DocEntry[];
      // DL-042マイグレーション: 新フィールドがない既存データにnullを設定
      let migrated = false;
      for (const doc of documents) {
        const record = doc as unknown as Record<string, unknown>;
        if (doc.createdBy === undefined) {
          record.createdBy = null;
          migrated = true;
        }
        if (doc.updatedBy === undefined) {
          record.updatedBy = null;
          migrated = true;
        }
        if (doc.updatedAt === undefined) {
          record.updatedAt = null;
          migrated = true;
        }
        if (doc.statusChangedBy === undefined) {
          record.statusChangedBy = null;
          migrated = true;
        }
        if (doc.statusChangedAt === undefined) {
          record.statusChangedAt = null;
          migrated = true;
        }
      }
      if (migrated) {
        save();
        console.log('[documentStore] 新フィールドをnullで補完（マイグレーション）');
      }
      console.log(`[documentStore] ${documents.length}件をJSONから読み込み`);
    } else {
      documents = [];
      console.log('[documentStore] JSONファイルなし。空で起動');
    }
  } catch (err) {
    console.error('[documentStore] JSON読み込みエラー:', err);
    documents = [];
  }
}

/**
 * JSONに書き出し（同期。データ量が小さいため問題なし）
 */
function save(): void {
  try {
    if (!existsSync(DATA_DIR)) {
      mkdirSync(DATA_DIR, { recursive: true });
    }
    writeFileSync(DATA_FILE, JSON.stringify(documents, null, 2), 'utf-8');
  } catch (err) {
    console.error('[documentStore] JSON書き出しエラー:', err);
  }
}

/**
 * 全ドキュメント取得（clientIdフィルタ任意）
 */
export function getDocuments(clientId?: string): DocEntry[] {
  if (clientId) {
    return documents.filter(d => d.clientId === clientId);
  }
  return [...documents];
}

/**
 * ドキュメント一括追加（重複チェック: driveFileIdまたはfileHashで判定）
 */
export function addDocuments(docs: DocEntry[]): { added: number; skipped: number } {
  const existingDriveIds = new Set(
    documents.map(d => d.driveFileId).filter(Boolean)
  );
  const existingHashes = new Set(
    documents.map(d => d.fileHash).filter(Boolean)
  );

  const newDocs = docs.filter(d => {
    if (d.driveFileId && existingDriveIds.has(d.driveFileId)) return false;
    if (d.fileHash && existingHashes.has(d.fileHash)) return false;
    return true;
  });

  documents.push(...newDocs);
  save();

  console.log(`[documentStore] ${newDocs.length}件追加（重複${docs.length - newDocs.length}件スキップ）`);
  return { added: newDocs.length, skipped: docs.length - newDocs.length };
}

/**
 * ステータス更新（statusChangedBy/At/updatedBy/At含む）
 */
export function updateDocumentStatus(
  id: string,
  status: DocEntry['status'],
  extra?: {
    statusChangedBy?: string | null
    statusChangedAt?: string | null
    updatedBy?: string | null
    updatedAt?: string | null
  },
): boolean {
  const doc = documents.find(d => d.id === id);
  if (!doc) return false;
  doc.status = status;
  if (extra) {
    if (extra.statusChangedBy !== undefined) doc.statusChangedBy = extra.statusChangedBy;
    if (extra.statusChangedAt !== undefined) doc.statusChangedAt = extra.statusChangedAt;
    if (extra.updatedBy !== undefined) doc.updatedBy = extra.updatedBy;
    if (extra.updatedAt !== undefined) doc.updatedAt = extra.updatedAt;
  }
  save();
  return true;
}

/**
 * 選別完了→送出時にbatchId/journalIdを全件付与
 */
export function assignBatchAndJournalIds(clientId: string): { batchId: string; count: number } {
  const ts = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 15);
  const batchId = `batch-${clientId}-${ts}`;
  const targets = documents.filter(d => d.clientId === clientId && !d.batchId);
  for (const doc of targets) {
    doc.batchId = batchId;
    doc.journalId = crypto.randomUUID();
  }
  save();
  console.log(`[documentStore] batchId=${batchId} journalId付与: ${targets.length}件`);
  return { batchId, count: targets.length };
}

/**
 * 顧問先の全資料を削除（仕訳処理送出後）
 */
export function removeByClientId(clientId: string): number {
  const before = documents.length;
  documents = documents.filter(d => d.clientId !== clientId);
  save();
  return before - documents.length;
}

// ============================================================
// DL-042: CRUD不足補完
// ============================================================

/**
 * IDで1件取得
 */
export function getById(id: string): DocEntry | undefined {
  return documents.find(d => d.id === id);
}

/**
 * IDで個別削除
 */
export function deleteById(id: string): boolean {
  const before = documents.length;
  documents = documents.filter(d => d.id !== id);
  if (documents.length < before) {
    save();
    return true;
  }
  return false;
}

/**
 * 件数取得（clientIdフィルタ任意）
 */
export function countDocuments(clientId?: string): number {
  if (clientId) {
    return documents.filter(d => d.clientId === clientId).length;
  }
  return documents.length;
}

/**
 * ステータス別取得
 */
export function getByStatus(clientId: string, status: DocEntry['status']): DocEntry[] {
  return documents.filter(d => d.clientId === clientId && d.status === status);
}

/**
 * ステータス別件数
 */
export function countByStatus(clientId: string): Record<string, number> {
  const result: Record<string, number> = {};
  for (const d of documents) {
    if (d.clientId !== clientId) continue;
    result[d.status] = (result[d.status] || 0) + 1;
  }
  return result;
}

// ============================================================
// フェーズ3.5: AI分類結果書き戻し（migrationWorkerから呼び出し）
// ============================================================

/**
 * DriveファイルのDocEntryにAI分類結果を書き込む
 *
 * @param driveFileId - DriveファイルID（DocEntry.driveFileIdで検索）
 * @param result - previewExtractImage()の戻り値
 * @param fileHash - SHA-256ハッシュ（processOneJobで計算済み）
 * @returns 更新成功したか
 */
export function updateAiResults(
  driveFileId: string,
  result: PreviewExtractResponse,
  fileHash: string,
): boolean {
  const doc = documents.find(d => d.driveFileId === driveFileId);
  if (!doc) {
    console.warn(`[documentStore] updateAiResults: driveFileId=${driveFileId} が見つからない`);
    return false;
  }

  // ファイルハッシュ
  doc.fileHash = fileHash;

  // AI分類結果
  doc.aiDate = result.date ?? null;
  doc.aiAmount = result.total_amount ?? null;
  doc.aiVendor = result.issuer_name ?? null;
  doc.aiSourceType = result.source_type ?? null;
  doc.aiDirection = result.direction ?? null;
  doc.aiDescription = result.description ?? null;
  doc.aiPreviewExtractReason = result.preview_extract_reason ?? null;
  doc.aiLineItems = result.line_items.length > 0 ? result.line_items : null;
  doc.aiLineItemsCount = result.line_items.length;
  doc.aiSupplementary = result.validation.supplementary;
  doc.aiDocumentCount = result.document_count;
  doc.aiWarning = result.validation.warning ?? null;
  doc.aiProcessingMode = result.processing_mode ?? null;
  doc.aiFallbackApplied = result.fallback_applied;

  // メトリクス
  doc.aiMetrics = {
    source_type_confidence: result.source_type_confidence,
    direction_confidence: result.direction_confidence,
    duration_ms: result.metadata.duration_ms,
    prompt_tokens: result.metadata.prompt_tokens,
    completion_tokens: result.metadata.completion_tokens,
    thinking_tokens: result.metadata.thinking_tokens,
    token_count: result.metadata.token_count,
    cost_yen: result.metadata.cost_yen,
    model: result.metadata.model,
    original_size_kb: result.metadata.original_size_kb,
    processed_size_kb: result.metadata.processed_size_kb,
    preprocess_reduction_pct: result.metadata.preprocess_reduction_pct,
  };

  save();
  console.log(
    `[documentStore] AI分類結果書き込み: ${driveFileId}`
    + ` → ${result.source_type} (${result.source_type_confidence})`
    + ` ${result.line_items.length}行`,
  );
  return true;
}

// ============================================================
// previewExtractデータ完全削除（確定送信後に呼び出し）
// 設計方針: previewExtract.service.ts ヘッダー参照
// ============================================================


/** DocEntryのai*フィールドを全てnullに設定する */
function nullifyAiFields(doc: DocEntry): void {
  const record = doc as unknown as Record<string, unknown>;
  for (const key of AI_FIELD_KEYS) {
    record[key] = null;
  }
}

/**
 * 指定DocEntryのpreviewExtractデータ（ai*フィールド）を完全削除
 *
 * 確定送信後に呼び出す。仕訳変換が完了した後に実行すること。
 * Extract API（本番AI）がゼロから仕訳データを再生成するため、
 * previewExtractの出力は不要になる。
 *
 * @param id - DocEntryのID
 * @returns 削除成功したか
 */
export function clearAiFields(id: string): boolean {
  const doc = documents.find(d => d.id === id);
  if (!doc) return false;

  nullifyAiFields(doc);
  doc.updatedAt = new Date().toISOString();
  save();
  return true;
}

/**
 * 顧問先の全DocEntryのpreviewExtractデータを一括削除
 *
 * @param clientId - 顧問先ID
 * @returns 削除したDocEntry件数
 */
export function clearAiFieldsByClientId(clientId: string): number {
  const targets = documents.filter(d => d.clientId === clientId);
  for (const doc of targets) {
    nullifyAiFields(doc);
    doc.updatedAt = new Date().toISOString();
  }
  if (targets.length > 0) save();
  console.log(`[documentStore] previewExtractデータ削除: ${clientId} → ${targets.length}件`);
  return targets.length;
}

// 起動時に自動読み込み
loadDocuments();
