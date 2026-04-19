/**
 * 出力履歴 + CSVスナップショット JSON永続化ストア
 *
 * 顧問先ごとにファイル分割:
 *   data/export-history-{clientId}.json → 履歴一覧
 *   data/export-csv-{clientId}-{historyId}.json → CSVスナップショット
 *
 * 準拠: DL-042（localStorage依存排除）
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const DATA_DIR = join(process.cwd(), 'data');

/** 履歴エントリ */
interface ExportHistoryEntry {
  id: string;
  exportDate: string;
  fileName: string;
  count: number;
  status: string;
}

/** CSVスナップショット */
interface CsvSnapshot {
  historyId: string;
  fileName: string;
  exportDate: string;
  journalCount: number;
  csvContent: string;
}

function ensureDir(): void {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
}

function historyPath(clientId: string): string {
  return join(DATA_DIR, `export-history-${clientId}.json`);
}

function csvPath(clientId: string, historyId: string): string {
  return join(DATA_DIR, `export-csv-${clientId}-${historyId}.json`);
}

// ────── 履歴 ──────

export function getExportHistory(clientId: string): ExportHistoryEntry[] {
  const fp = historyPath(clientId);
  if (!existsSync(fp)) return [];
  try {
    return JSON.parse(readFileSync(fp, 'utf-8')) as ExportHistoryEntry[];
  } catch {
    return [];
  }
}

export function addExportHistory(clientId: string, entry: ExportHistoryEntry): void {
  ensureDir();
  const list = getExportHistory(clientId);
  list.unshift(entry);
  writeFileSync(historyPath(clientId), JSON.stringify(list, null, 2), 'utf-8');
}

// ────── CSVスナップショット ──────

export function getCsvSnapshot(clientId: string, historyId: string): CsvSnapshot | null {
  const fp = csvPath(clientId, historyId);
  if (!existsSync(fp)) return null;
  try {
    return JSON.parse(readFileSync(fp, 'utf-8')) as CsvSnapshot;
  } catch {
    return null;
  }
}

export function saveCsvSnapshot(clientId: string, snapshot: CsvSnapshot): void {
  ensureDir();
  writeFileSync(csvPath(clientId, snapshot.historyId), JSON.stringify(snapshot, null, 2), 'utf-8');
}
