/**
 * CSV変換ログ JSON永続化ストア
 *
 * data/conversion-logs.json に変換履歴を保存。
 * 変換後CSVファイルは data/conversions/ に保存。
 *
 * 準拠: ScreenG_DataConversion サーバーAPI化
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync, unlinkSync } from 'fs';
import { join } from 'path';
import { randomBytes } from 'crypto';

const DATA_DIR = join(process.cwd(), 'data');
const LOG_FILE = join(DATA_DIR, 'conversion-logs.json');
const CSV_DIR = join(DATA_DIR, 'conversions');
const MAX_LOGS = 100;

/** 安全なID生成（conv_XXXXXXXX形式） */
function generateConversionId(): string {
  return `conv_${randomBytes(8).toString('hex')}`;
}

function ensureDir(): void {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  if (!existsSync(CSV_DIR)) mkdirSync(CSV_DIR, { recursive: true });
}

// ============================================================
// 型定義
// ============================================================

export interface ConversionLog {
  id: string;
  timestamp: string;
  clientName: string;
  sourceSoftware: string;
  targetSoftware: string;
  fileName: string;
  size: number;
  csvPath: string;        // data/conversions/ 配下のパス
  isDownloaded: boolean;
}

// ============================================================
// 読み書き
// ============================================================

/** 全ログ取得（新しい順） */
export function getAllLogs(): ConversionLog[] {
  if (!existsSync(LOG_FILE)) return [];
  try {
    return JSON.parse(readFileSync(LOG_FILE, 'utf-8')) as ConversionLog[];
  } catch {
    return [];
  }
}

/** 全件保存（上書き） */
function saveAll(logs: ConversionLog[]): void {
  ensureDir();
  writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2), 'utf-8');
}

// ============================================================
// CRUD
// ============================================================

/** 変換ログ+CSVファイルを追加 */
export function addLog(
  clientName: string,
  sourceSoftware: string,
  targetSoftware: string,
  csvContent: string,
  fileName: string,
): ConversionLog {
  ensureDir();
  const id = generateConversionId();
  const csvPath = `${id}_${fileName}`;
  const fullPath = join(CSV_DIR, csvPath);
  // BOM付きUTF-8で保存（Excel互換）
  writeFileSync(fullPath, '\ufeff' + csvContent, 'utf-8');

  const size = Buffer.byteLength(csvContent, 'utf-8');
  const log: ConversionLog = {
    id,
    timestamp: new Date().toLocaleString('ja-JP', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    }),
    clientName,
    sourceSoftware,
    targetSoftware,
    fileName,
    size,
    csvPath,
    isDownloaded: false,
  };

  const all = getAllLogs();
  all.unshift(log);
  if (all.length > MAX_LOGS) all.length = MAX_LOGS;
  saveAll(all);

  return log;
}

/** ダウンロード済みマーク */
export function markAsDownloaded(id: string): boolean {
  const all = getAllLogs();
  const target = all.find(l => l.id === id);
  if (!target) return false;
  target.isDownloaded = true;
  saveAll(all);
  return true;
}

/** ログ削除（CSVファイルも削除） */
export function deleteLog(id: string): boolean {
  const all = getAllLogs();
  const idx = all.findIndex(l => l.id === id);
  if (idx === -1) return false;
  const removed = all[idx]!;
  // CSVファイル削除
  const csvFullPath = join(CSV_DIR, removed.csvPath);
  try {
    if (existsSync(csvFullPath)) unlinkSync(csvFullPath);
  } catch { /* ファイルが既に無い場合は無視 */ }
  all.splice(idx, 1);
  saveAll(all);
  return true;
}

/** CSVファイルのフルパスを取得 */
export function getCsvFilePath(id: string): string | null {
  const all = getAllLogs();
  const log = all.find(l => l.id === id);
  if (!log) return null;
  const fullPath = join(CSV_DIR, log.csvPath);
  if (!existsSync(fullPath)) return null;
  return fullPath;
}
