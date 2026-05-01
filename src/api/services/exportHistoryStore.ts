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
  /** 仕訳件数（証票数） */
  count: number;
  /** CSV行数（複合仕訳展開後） */
  csvLineCount?: number;
  /** 出力者スタッフID */
  staffId?: string;
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
  console.log(`[exportHistoryStore] ${clientId}: 履歴追加 (仕訳${entry.count}件, CSV${entry.csvLineCount ?? '?'}行, staff=${entry.staffId ?? '不明'})`);
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

// ────── 集計（ダッシュボード用） ──────

import { readdirSync } from 'fs';

/** 全顧問先のCSV行数集計（今月分） */
export function summarizeCsvLines(): {
  byClient: { clientId: string; csvLineCount: number; journalCount: number; exportCount: number }[];
  byStaff: { staffId: string; csvLineCount: number; journalCount: number; exportCount: number }[];
  total: { csvLineCount: number; journalCount: number; exportCount: number };
} {
  const now = new Date();
  const yearMonth = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}`;

  const clientMap = new Map<string, { csvLineCount: number; journalCount: number; exportCount: number }>();
  const staffMap = new Map<string, { csvLineCount: number; journalCount: number; exportCount: number }>();
  let totalCsv = 0;
  let totalJournal = 0;
  let totalExport = 0;

  // data/export-history-*.json を走査
  if (!existsSync(DATA_DIR)) return { byClient: [], byStaff: [], total: { csvLineCount: 0, journalCount: 0, exportCount: 0 } };
  const files = readdirSync(DATA_DIR).filter(f => f.startsWith('export-history-') && f.endsWith('.json'));

  for (const file of files) {
    const clientId = file.replace('export-history-', '').replace('.json', '');
    try {
      const entries = JSON.parse(readFileSync(join(DATA_DIR, file), 'utf-8')) as ExportHistoryEntry[];
      for (const e of entries) {
        // 今月分のみ集計（exportDate: YYYY/MM/DD形式）
        if (!e.exportDate.startsWith(yearMonth)) continue;

        const lines = e.csvLineCount ?? 0;
        const count = e.count ?? 0;

        // 顧問先別
        const c = clientMap.get(clientId) ?? { csvLineCount: 0, journalCount: 0, exportCount: 0 };
        c.csvLineCount += lines;
        c.journalCount += count;
        c.exportCount++;
        clientMap.set(clientId, c);

        // スタッフ別
        const sid = e.staffId ?? 'unknown';
        const s = staffMap.get(sid) ?? { csvLineCount: 0, journalCount: 0, exportCount: 0 };
        s.csvLineCount += lines;
        s.journalCount += count;
        s.exportCount++;
        staffMap.set(sid, s);

        // 全体
        totalCsv += lines;
        totalJournal += count;
        totalExport++;
      }
    } catch {
      // 読み込みエラーは無視
    }
  }

  return {
    byClient: Array.from(clientMap.entries()).map(([clientId, v]) => ({ clientId, ...v })),
    byStaff: Array.from(staffMap.entries()).map(([staffId, v]) => ({ staffId, ...v })),
    total: { csvLineCount: totalCsv, journalCount: totalJournal, exportCount: totalExport },
  };
}
