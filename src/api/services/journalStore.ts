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

const DATA_DIR = join(process.cwd(), 'data');

// インメモリキャッシュ（clientIdごと）
const journalCache = new Map<string, unknown[]>();

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
    writeFileSync(getFilePath(clientId), JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`[journalStore] JSON書き出しエラー (${clientId}):`, err);
  }
}

/** clientIdの仕訳データをJSONから読み込み */
function loadClient(clientId: string): unknown[] {
  if (journalCache.has(clientId)) {
    return journalCache.get(clientId)!;
  }
  try {
    const filePath = getFilePath(clientId);
    if (existsSync(filePath)) {
      const raw = readFileSync(filePath, 'utf-8');
      const data = JSON.parse(raw) as unknown[];
      journalCache.set(clientId, data);
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

/** 顧問先の仕訳データを全件取得 */
export function getJournals(clientId: string): unknown[] {
  return loadClient(clientId);
}

/** 顧問先の仕訳データを全件上書き保存 */
export function saveJournals(clientId: string, journals: unknown[]): void {
  journalCache.set(clientId, journals);
  save(clientId);
  console.log(`[journalStore] ${clientId}: ${journals.length}件を保存`);
}

/** 顧問先の仕訳データに追加 */
export function addJournals(clientId: string, newJournals: unknown[]): number {
  const existing = loadClient(clientId);
  existing.push(...newJournals);
  save(clientId);
  return newJournals.length;
}

/** 件数取得 */
export function countJournals(clientId: string): number {
  return loadClient(clientId).length;
}
