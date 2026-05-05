/**
 * confirmedJournalStore.ts — 確定済み仕訳JSON永続化ストア（更新: 2026-04-29）
 *
 * 【設計原則】
 * - サーバー側のインメモリ + JSONファイル永続化（documentStore.tsと同パターン）
 * - 起動時にJSONから読み込み、更新時にJSONに書き出し
 * - Supabase移行時にDB操作に差し替え
 *
 * 【ファイル場所】
 * - data/confirmed_journals.json（.gitignoreに追加すること）
 *
 * 設計根拠: docs/genzai/25_past_journal.md §5
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import type { ConfirmedJournal } from '../../types/confirmed_journal.type';

const DATA_DIR = join(process.cwd(), 'data');
const DATA_FILE = join(DATA_DIR, 'confirmed_journals.json');

// インメモリストア
let journals: ConfirmedJournal[] = [];

// ============================================================
// § 読み込み・書き出し
// ============================================================

/**
 * 起動時にJSONから読み込み
 */
export function loadConfirmedJournals(): void {
  try {
    if (existsSync(DATA_FILE)) {
      const raw = readFileSync(DATA_FILE, 'utf-8');
      journals = JSON.parse(raw) as ConfirmedJournal[];
      console.log(`[confirmedJournalStore] ${journals.length}件をJSONから読み込み`);
    } else {
      journals = [];
      console.log('[confirmedJournalStore] JSONファイルなし。空で起動');
    }
  } catch (err) {
    console.error('[confirmedJournalStore] JSON読み込みエラー:', err);
    journals = [];
  }
}

/**
 * JSONに書き出し（同期）
 */
function save(): void {
  try {
    if (!existsSync(DATA_DIR)) {
      mkdirSync(DATA_DIR, { recursive: true });
    }
    writeFileSync(DATA_FILE, JSON.stringify(journals, null, 2), 'utf-8');
  } catch (err) {
    console.error('[confirmedJournalStore] JSON書き出しエラー:', err);
  }
}

// ============================================================
// § CRUD
// ============================================================

/**
 * 顧問先の確定済み仕訳全件取得
 */
export function getByClientId(client_id: string): ConfirmedJournal[] {
  return journals.filter(j => j.client_id === client_id);
}

/**
 * match_keyで絞り込み（過去仕訳照合 Step 2）
 */
export function findByMatchKey(client_id: string, match_key: string): ConfirmedJournal[] {
  return journals.filter(j => j.client_id === client_id && j.match_key === match_key);
}

/**
 * 一括インポート（重複排除: client_id + mf_transaction_no + voucher_date）
 */
export function importJournals(new_journals: ConfirmedJournal[]): { added: number; skipped: number } {
  // 既存の重複キーセット
  const existing_keys = new Set(
    journals
      .filter(j => j.mf_transaction_no !== null)
      .map(j => `${j.client_id}:${j.mf_transaction_no}:${j.voucher_date}`)
  );

  const to_add = new_journals.filter(j => {
    if (j.mf_transaction_no === null) return true; // 取引Noなし→常に追加
    const key = `${j.client_id}:${j.mf_transaction_no}:${j.voucher_date}`;
    return !existing_keys.has(key);
  });

  journals.push(...to_add);
  save();

  const skipped = new_journals.length - to_add.length;
  console.log(`[confirmedJournalStore] ${to_add.length}件追加（重複${skipped}件スキップ）`);
  return { added: to_add.length, skipped };
}

/**
 * インポートバッチ単位で削除
 */
export function deleteByBatchId(import_batch_id: string): number {
  const before = journals.length;
  journals = journals.filter(j => j.import_batch_id !== import_batch_id);
  if (journals.length < before) {
    save();
  }
  return before - journals.length;
}

/**
 * 顧問先の全件削除
 */
export function deleteByClientId(client_id: string): number {
  const before = journals.length;
  journals = journals.filter(j => j.client_id !== client_id);
  if (journals.length < before) {
    save();
  }
  return before - journals.length;
}

/**
 * 件数取得（顧問先別）
 */
export function countByClientId(client_id: string): number {
  return journals.filter(j => j.client_id === client_id).length;
}

/**
 * バッチIDで仕訳取得（CSVダウンロード用）
 */
export function getByBatchId(import_batch_id: string): ConfirmedJournal[] {
  return journals.filter(j => j.import_batch_id === import_batch_id);
}

/**
 * インポートバッチ一覧取得（顧問先別）
 */
export function getImportBatches(client_id: string): {
  import_batch_id: string;
  client_id: string;
  imported_at: string;
  count: number;
  min_voucher_date: string;
  max_voucher_date: string;
}[] {
  const batches = new Map<string, {
    imported_at: string;
    count: number;
    min_voucher_date: string;
    max_voucher_date: string;
  }>();

  for (const j of journals) {
    if (j.client_id !== client_id) continue;
    const existing = batches.get(j.import_batch_id);
    if (existing) {
      existing.count++;
      if (j.voucher_date < existing.min_voucher_date) existing.min_voucher_date = j.voucher_date;
      if (j.voucher_date > existing.max_voucher_date) existing.max_voucher_date = j.voucher_date;
    } else {
      batches.set(j.import_batch_id, {
        imported_at: j.imported_at,
        count: 1,
        min_voucher_date: j.voucher_date,
        max_voucher_date: j.voucher_date,
      });
    }
  }

  return Array.from(batches.entries())
    .map(([import_batch_id, data]) => ({
      import_batch_id,
      client_id,
      ...data,
    }))
    .sort((a, b) => b.imported_at.localeCompare(a.imported_at)); // 新しい順
}

// 起動時に自動読み込み
loadConfirmedJournals();
