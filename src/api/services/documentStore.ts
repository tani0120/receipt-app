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
      // DL-042マイグレーション: createdByフィールドがない既存データにnullを設定
      let migrated = false;
      for (const doc of documents) {
        if (doc.createdBy === undefined) {
          (doc as any).createdBy = null;
          migrated = true;
        }
      }
      if (migrated) {
        save();
        console.log('[documentStore] createdByフィールドをnullで補完（マイグレーション）');
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
 * ステータス更新
 */
export function updateDocumentStatus(id: string, status: DocEntry['status']): boolean {
  const doc = documents.find(d => d.id === id);
  if (!doc) return false;
  doc.status = status;
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

// 起動時に自動読み込み
loadDocuments();
