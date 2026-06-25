/**
 * journalStore.ts — 仕訳データJSON永続化ストア
 *
 * 【設計原則】
 * - サーバー側のインメモリ + JSONファイル永続化
 * -顧問先ID (clientId) ごとに data/journals-{clientId}.json で管理
 * - useJournals.ts（フロント）がAPI経由で読み書き
 * - Supabase移行時にDB操作に差し替え
 *
 * 【ファイル場所】
 * - data/journals-{clientId}.json（.gitignoreでdata/が除外済み）
 *
 * 準拠: DL-042（#12 useJournals localStorage脱却）
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

import crypto from 'crypto';
import { migrateLegacyDeterminationMethod } from './migration/migrateLegacyDeterminationMethod';

const DATA_DIR = join(process.cwd(), 'data');

// ============================================================
// ID発番ヘルパー
// ============================================================

const ID_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

/** jrn_XXXXXXXX 形式の仕訳IDをサーバーで発番 */
function generateJournalId(): string {
  const bytes = crypto.randomBytes(8);
  let id = 'jrn_';
  for (let i = 0; i < 8; i++) {
    id += ID_CHARS[bytes[i]! % ID_CHARS.length];
  }
  return id;
}

/** jre_XXXXXXXX 形式の仕訳行IDをサーバーで発番 */
function generateJournalEntryId(): string {
  const bytes = crypto.randomBytes(8);
  let id = 'jre_';
  for (let i = 0; i < 8; i++) {
    id += ID_CHARS[bytes[i]! % ID_CHARS.length];
  }
  return id;
}

// インメモリキャッシュ（clientIdごと）
// JSONから読み込んだオブジェクトはRecord<string, unknown>として保持
const journalCache = new Map<string, Record<string, unknown>[]>();

function getFilePath(clientId: string): string {
  // ファイル名にclientIdを含める（安全な文字のみ許可）
  const safe = clientId.replace(/[^a-zA-Z0-9_-]/g, '_');
  return join(DATA_DIR, `journals-${safe}.json`);
}

// ============================================================
// 永続化
// ============================================================

function save(clientId: string): void {
  try {
    if (!existsSync(DATA_DIR)) {
      mkdirSync(DATA_DIR, { recursive: true });
    }
    const data = journalCache.get(clientId) || [];
    // warning_details（警告詳細）は導出値（syncWarningLabelsCore が毎回再計算→上書き）。
    // 永続化しない。読込時は syncWarningLabelsCore が {} で初期化する。
    const cleaned = data.map(j => {
      const { warning_details, ...rest } = j as Record<string, unknown>;
      return rest;
    });
    writeFileSync(getFilePath(clientId), JSON.stringify(cleaned, null, 2), 'utf-8');
  } catch (err) {
    console.error(`[journalStore] JSON書き出しエラー (${clientId}):`, err);
  }
}

/** clientIdの仕訳データをJSONから読み込み */
function loadClient(clientId: string): Record<string, unknown>[] {
  if (journalCache.has(clientId)) {
    return journalCache.get(clientId)!;
  }
  try {
    const filePath = getFilePath(clientId);
    if (existsSync(filePath)) {
      const raw = readFileSync(filePath, 'utf-8');
      const data = JSON.parse(raw) as Record<string, unknown>[];
      journalCache.set(clientId, data);
      // 移行: determination_method 未設定の旧仕訳に 'legacy' を設定
      if (migrateLegacyDeterminationMethod(data)) {
        save(clientId);
      }
      console.log(`[journalStore] ${clientId}: ${data.length}件をJSONから読み込み`);
      return data;
    }
  } catch (err) {
    console.error(`[journalStore] JSON読み込みエラー (${clientId}):`, err);
  }
  // ファイルなし → 空配列
  journalCache.set(clientId, []);
  return [];
}

// ============================================================
// CRUD
// ============================================================

/**
 * 顧問先の仕訳データを全件取得
 *
 * ジェネリクスで呼び出し元が期待する型を指定可能。
 * JSONから読み込んだデータは構造的にTと互換であることが前提。
 * Supabase移行時はDB型バリデーション済みデータが返るため安全。
 */
export function getJournals<T = Record<string, unknown>>(clientId: string): T[] {
  return loadClient(clientId) as T[];
}

/** 顧問先の仕訳データを全件上書き保存 */
export function saveJournals(clientId: string, journals: Record<string, unknown>[]): void {
  journalCache.set(clientId, journals);
  save(clientId);
  console.log(`[journalStore] ${clientId}: ${journals.length}件を保存`);
}

/** 顧問先の仕訳データに追加（サーバーがIDを上書き発番） */
export function addJournals(clientId: string, newJournals: Record<string, unknown>[]): number {
  const existing = loadClient(clientId);
  // サーバーがID上書き発番（フロントが送ったIDは信頼しない）
  for (const journal of newJournals) {
    journal.journalId = generateJournalId();
    // debit_entries / credit_entries のIDも上書き
    if (Array.isArray(journal.debit_entries)) {
      for (const entry of journal.debit_entries as Record<string, unknown>[]) {
        entry.entryId = generateJournalEntryId();
      }
    }
    if (Array.isArray(journal.credit_entries)) {
      for (const entry of journal.credit_entries as Record<string, unknown>[]) {
        entry.entryId = generateJournalEntryId();
      }
    }
  }
  existing.push(...newJournals);
  save(clientId);
  return newJournals.length;
}

/** 1件の仕訳を部分更新（PATCH用） */
export function updateJournal(clientId: string, journalId: string, patch: Record<string, unknown>): Record<string, unknown> | null {
  const journals = loadClient(clientId);
  const journal = journals.find((j) => j.journalId === journalId);
  if (!journal) return null;
  // パッチ適用（トップレベルフィールドのみ。ネストは全置換）
  Object.assign(journal, patch);
  save(clientId);
  return journal;
}

/** 件数取得 */
export function countJournals(clientId: string): number {
  return loadClient(clientId).length;
}
