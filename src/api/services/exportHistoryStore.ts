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

/** 期間別の集計バケット（仕訳数＝CSV行数、なければcount） */
interface PeriodBucket {
  csvLineCount: number;
  journalCount: number;
  exportCount: number;
}

function emptyBucket(): PeriodBucket {
  return { csvLineCount: 0, journalCount: 0, exportCount: 0 };
}

/** エントリから仕訳数を取得（csvLineCount優先、なければcount） */
function getLineCount(e: ExportHistoryEntry): number {
  return e.csvLineCount ?? e.count ?? 0;
}

/** 全顧問先のCSV出力実績集計（今月・月平均・昨年同月・今年・昨年） */
export function summarizeCsvLines(): {
  thisMonth: PeriodBucket;
  monthlyAvg: PeriodBucket;
  lastYearSameMonth: PeriodBucket;
  thisYear: PeriodBucket;
  lastYear: PeriodBucket;
  byClient: { clientId: string; thisMonth: PeriodBucket; thisYear: PeriodBucket; lastYear: PeriodBucket }[];
  byStaff: { staffId: string; thisMonth: PeriodBucket; thisYear: PeriodBucket; lastYear: PeriodBucket }[];
} {
  const now = new Date();
  const thisYearNum = now.getFullYear();
  const thisMonthNum = now.getMonth() + 1; // 1-12
  const thisYearStr = `${thisYearNum}`; // '2026'
  const lastYearStr = `${thisYearNum - 1}`; // '2025'
  const thisMonthStr = `${thisYearStr}/${String(thisMonthNum).padStart(2, '0')}`; // '2026/05'
  const lastYearSameMonthStr = `${lastYearStr}/${String(thisMonthNum).padStart(2, '0')}`; // '2025/05'

  const totals = {
    thisMonth: emptyBucket(),
    lastYearSameMonth: emptyBucket(),
    thisYear: emptyBucket(),
    lastYear: emptyBucket(),
  };

  /** 月平均算出用: 'YYYY/MM' → バケット */
  const monthlyMap = new Map<string, PeriodBucket>();

  const clientMap = new Map<string, { thisMonth: PeriodBucket; thisYear: PeriodBucket; lastYear: PeriodBucket }>();
  const staffMap = new Map<string, { thisMonth: PeriodBucket; thisYear: PeriodBucket; lastYear: PeriodBucket }>();

  if (!existsSync(DATA_DIR)) {
    return { ...totals, monthlyAvg: emptyBucket(), byClient: [], byStaff: [] };
  }

  const files = readdirSync(DATA_DIR).filter(f => f.startsWith('export-history-') && f.endsWith('.json'));

  for (const file of files) {
    const clientId = file.replace('export-history-', '').replace('.json', '');

    try {
      const entries = JSON.parse(readFileSync(join(DATA_DIR, file), 'utf-8')) as ExportHistoryEntry[];

      for (const e of entries) {
        const date = e.exportDate ?? ''; // 'YYYY/MM/DD'
        const lines = getLineCount(e);
        const count = e.count ?? 0;

        // 期間判定
        const isThisMonth = date.startsWith(thisMonthStr);
        const isThisYear = date.startsWith(thisYearStr);
        const isLastYear = date.startsWith(lastYearStr);
        const isLastYearSameMonth = date.startsWith(lastYearSameMonthStr);

        // 月別集計（月平均用）
        const yearMonthKey = date.slice(0, 7); // 'YYYY/MM'
        if (yearMonthKey.length === 7) {
          const mb = monthlyMap.get(yearMonthKey) ?? emptyBucket();
          mb.csvLineCount += lines;
          mb.journalCount += count;
          mb.exportCount++;
          monthlyMap.set(yearMonthKey, mb);
        }

        // 全体集計
        if (isThisMonth) {
          totals.thisMonth.csvLineCount += lines;
          totals.thisMonth.journalCount += count;
          totals.thisMonth.exportCount++;
        }
        if (isLastYearSameMonth) {
          totals.lastYearSameMonth.csvLineCount += lines;
          totals.lastYearSameMonth.journalCount += count;
          totals.lastYearSameMonth.exportCount++;
        }
        if (isThisYear) {
          totals.thisYear.csvLineCount += lines;
          totals.thisYear.journalCount += count;
          totals.thisYear.exportCount++;
        }
        if (isLastYear) {
          totals.lastYear.csvLineCount += lines;
          totals.lastYear.journalCount += count;
          totals.lastYear.exportCount++;
        }

        // 顧問先別（今月・今年・昨年）
        if (isThisMonth || isThisYear || isLastYear) {
          const c = clientMap.get(clientId) ?? { thisMonth: emptyBucket(), thisYear: emptyBucket(), lastYear: emptyBucket() };
          if (isThisMonth) {
            c.thisMonth.csvLineCount += lines;
            c.thisMonth.journalCount += count;
            c.thisMonth.exportCount++;
          }
          if (isThisYear) {
            c.thisYear.csvLineCount += lines;
            c.thisYear.journalCount += count;
            c.thisYear.exportCount++;
          }
          if (isLastYear) {
            c.lastYear.csvLineCount += lines;
            c.lastYear.journalCount += count;
            c.lastYear.exportCount++;
          }
          clientMap.set(clientId, c);
        }

        // スタッフ別（今月・今年・昨年）
        if (isThisMonth || isThisYear || isLastYear) {
          const sid = e.staffId ?? 'unknown';
          const s = staffMap.get(sid) ?? { thisMonth: emptyBucket(), thisYear: emptyBucket(), lastYear: emptyBucket() };
          if (isThisMonth) {
            s.thisMonth.csvLineCount += lines;
            s.thisMonth.journalCount += count;
            s.thisMonth.exportCount++;
          }
          if (isThisYear) {
            s.thisYear.csvLineCount += lines;
            s.thisYear.journalCount += count;
            s.thisYear.exportCount++;
          }
          if (isLastYear) {
            s.lastYear.csvLineCount += lines;
            s.lastYear.journalCount += count;
            s.lastYear.exportCount++;
          }
          staffMap.set(sid, s);
        }
      }
    } catch {
      // 読み込みエラーは無視
    }
  }

  // 1年移動平均（過去12ヶ月の合計 ÷ 12。データなし月は0扱い）
  const MOVING_AVG_MONTHS = 12;
  // 過去12ヶ月分のキーを生成
  let totalCsvAll = 0;
  let totalJournalAll = 0;
  let totalExportAll = 0;
  for (let i = 0; i < MOVING_AVG_MONTHS; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}`;
    const b = monthlyMap.get(key); // なければundefined → 0扱い
    totalCsvAll += b?.csvLineCount ?? 0;
    totalJournalAll += b?.journalCount ?? 0;
    totalExportAll += b?.exportCount ?? 0;
  }
  const monthlyAvg: PeriodBucket = {
    csvLineCount: Math.round(totalCsvAll / MOVING_AVG_MONTHS),
    journalCount: Math.round(totalJournalAll / MOVING_AVG_MONTHS),
    exportCount: Math.round(totalExportAll / MOVING_AVG_MONTHS),
  };

  return {
    ...totals,
    monthlyAvg,
    byClient: Array.from(clientMap.entries()).map(([clientId, v]) => ({ clientId, ...v })),
    byStaff: Array.from(staffMap.entries()).map(([staffId, v]) => ({ staffId, ...v })),
  };
}
