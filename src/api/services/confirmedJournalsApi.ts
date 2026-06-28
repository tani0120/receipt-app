/**
 * confirmedJournalsApi.ts — 確定済み仕訳データアクセス層（共通）
 *
 * 【責務】
 * - データの読み書きだけ。ビジネスロジックなし。
 * - サーバー側のインメモリ + JSONファイル永続化
 *
 * 【依存関係】
 * - ConfirmedJournalRepository（mock実装）がこのファイルをラップする
 * - confirmedJournalRoutes.ts（Honoルート）がこのファイルを直接呼ぶ
 * - Supabase移行時にDB操作に差し替え
 *
 * 【ファイル場所】
 * - data/confirmed_journals.json
 *
 * 準拠: DL-042, DL-030
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import type { Journal } from '../../types/journal.type';
import { journalSchema } from '../../types/journal.schema';
import { migrateLegacyDeterminationMethod } from './migration/migrateLegacyDeterminationMethod';

const DATA_DIR = join(process.cwd(), 'data');
const DATA_FILE = join(DATA_DIR, 'confirmed_journals.json');

// インメモリストア
let journals: Journal[] = [];

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
      journals = JSON.parse(raw) as Journal[];
      console.log(`[confirmedJournalsApi] ${journals.length}件をJSONから読み込み`);

      // 移行: determination_method 未設定の旧仕訳に 'legacy' を設定
      const rawData = journals as unknown as Record<string, unknown>[];
      if (migrateLegacyDeterminationMethod(rawData)) {
        save();
      }

      // zodバリデーション（構造検証。journalStoreと同等）
      let invalidCount = 0;
      for (const item of journals) {
        const result = journalSchema.safeParse(item);
        if (!result.success) {
          invalidCount++;
          if (invalidCount <= 3) {
            console.warn(`[confirmedJournalsApi] zodバリデーション警告 (${item.journalId ?? '不明'}):`, result.error.issues.slice(0, 3));
          }
        }
      }
      if (invalidCount > 0) {
        console.warn(`[confirmedJournalsApi] ${invalidCount}/${journals.length}件がzodスキーマ不適合（データは維持。修正推奨）`);
      }
    } else {
      journals = [];
      console.log('[confirmedJournalsApi] JSONファイルなし。空で起動');
    }
  } catch (err) {
    console.error('[confirmedJournalsApi] JSON読み込みエラー:', err);
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
    // warning_details（導出値）は永続化しない（journalStoreと同等）
    const cleaned = journals.map(({ warning_details, ...rest }) => rest);
    writeFileSync(DATA_FILE, JSON.stringify(cleaned, null, 2), 'utf-8');
  } catch (err) {
    console.error('[confirmedJournalsApi] JSON書き出しエラー:', err);
  }
}

// ============================================================
// § 全件操作（正規化スクリプト用）
// ============================================================

/**
 * 全件取得（顧問先問わず）
 */
export function getAll(): Journal[] {
  return journals;
}

/**
 * 全件書き戻し（正規化後のデータで上書き）
 */
export function replaceAll(newJournals: Journal[]): void {
  journals = newJournals;
  save();
}

// ============================================================
// § CRUD
// ============================================================

/**
 * 顧問先の確定済み仕訳全件取得
 */
export function getByClientId(client_id: string): Journal[] {
  return journals.filter(j => j.client_id === client_id);
}

/**
 * match_keyで絞り込み（過去仕訳照合 Step 2）
 */
export function findByMatchKey(client_id: string, match_key: string): Journal[] {
  return journals.filter(j => j.client_id === client_id && j.match_key === match_key);
}

/**
 * 一括インポート（重複排除: client_id + mf_transaction_no + voucher_date）
 */
export function importJournals(new_journals: Journal[]): { added: number; skipped: number } {
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
  console.log(`[confirmedJournalsApi] ${to_add.length}件追加（重複${skipped}件スキップ）`);
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
 * MF送信結果を確定済み仕訳に書き戻す
 *
 * mfJournalSender.sendBatchToMf() の結果を受け取り、
 * 対応する Journal に MF-ID / 送信日時 / ステータスを設定する。
 *
 * @returns 更新件数
 */
export function applyMfIds(
  results: Array<{ sugusruId: string; mfId?: string; mfNumber?: number }>
): number {
  const now = new Date().toISOString();
  let count = 0;
  for (const r of results) {
    if (!r.mfId) continue;
    const j = journals.find(j => j.journalId === r.sugusruId);
    if (!j) continue;
    j.mf_journal_id = r.mfId;
    j.mf_journal_number = r.mfNumber ?? null;
    j.mf_sent_at = now;
    j.status = 'exported';
    count++;
  }
  if (count > 0) {
    save();
    console.log(`[confirmedJournalsApi] MF-ID紐付け: ${count}件`);
  }
  return count;
}

/**
 * バッチIDで仕訳取得（CSVダウンロード用）
 */
export function getByBatchId(import_batch_id: string): Journal[] {
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
    const batchId = j.import_batch_id ?? '';
    const vDate = j.voucher_date ?? '';
    const existing = batches.get(batchId);
    if (existing) {
      existing.count++;
      if (vDate < existing.min_voucher_date) existing.min_voucher_date = vDate;
      if (vDate > existing.max_voucher_date) existing.max_voucher_date = vDate;
    } else {
      batches.set(batchId, {
        imported_at: j.imported_at ?? '',
        count: 1,
        min_voucher_date: vDate,
        max_voucher_date: vDate,
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
