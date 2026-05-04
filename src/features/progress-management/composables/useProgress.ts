/**
 * useProgress — 進捗管理 composable（API接続版）
 *
 * 【設計原則】useJournals.tsパターン準拠
 * - 仕訳データはuseJournals（API接続済み）から取得
 * - 証票データはuseDocuments（API接続済み）から取得
 * - 顧問先データはuseClients（API接続済み）から取得
 * - モックデータ直書きを廃止。全データをAPI接続済みcomposableから集計
 *
 * 準拠: DL-042
 */
import { ref, computed } from 'vue';
import { useClients } from '@/features/client-management/composables/useClients';
import { useStaff } from '@/features/staff-management/composables/useStaff';
import { useDocuments } from '@/composables/useDocuments';
import { useMonthColumns } from '../utils/monthColumns';
import { countUnsorted, latestReceivedDate } from '@/utils/documentUtils';
import type { ProgressRow, MonthColumn } from '../types';

// =============================================
// API通信ヘルパー
// =============================================

const API_BASE = '/api/journals'

interface JournalSummary {
  /** 未出力（仕訳残の件数） */
  unexported: number;
  /** 月別仕訳数 キー: "2025-04" 形式 */
  monthlyJournals: Record<string, number>;
  /** 今年度仕訳数 */
  currentYearJournals: number;
  /** 前年度仕訳数 */
  lastYearJournals: number;
}

/**
 * サーバーから顧問先の仕訳サマリを取得
 * GET /api/journals/:clientId → journals配列から集計
 */
async function fetchJournalSummary(clientId: string, cols: MonthColumn[]): Promise<JournalSummary> {
  try {
    const res = await fetch(`${API_BASE}/${encodeURIComponent(clientId)}`)
    if (!res.ok) return emptyJournalSummary(cols)
    const data = await res.json() as { journals: Array<{ voucher_date?: string | null; exported?: boolean; export_batch_id?: string | null }> }
    const journals = data.journals ?? []

    // 月別仕訳数を集計
    const monthlyJournals: Record<string, number> = {}
    cols.forEach(c => { monthlyJournals[c.key] = 0 })

    const now = new Date()
    const currentYear = now.getFullYear()
    let currentYearCount = 0
    let lastYearCount = 0

    for (const j of journals) {
      if (!j.voucher_date) continue
      const dateStr = j.voucher_date.slice(0, 7) // "2025-04"
      if (dateStr in monthlyJournals) {
        monthlyJournals[dateStr]++
      }
      const year = parseInt(j.voucher_date.slice(0, 4), 10)
      if (year === currentYear) currentYearCount++
      else if (year === currentYear - 1) lastYearCount++
    }

    // 未出力（exported=false または export_batch_id=null）
    const unexported = journals.filter(j => !j.exported && !j.export_batch_id).length

    return {
      unexported,
      monthlyJournals,
      currentYearJournals: currentYearCount,
      lastYearJournals: lastYearCount,
    }
  } catch (err) {
    console.error(`[useProgress] 仕訳サマリ取得失敗 (${clientId}):`, err)
    return emptyJournalSummary(cols)
  }
}

function emptyJournalSummary(cols: MonthColumn[]): JournalSummary {
  const monthlyJournals: Record<string, number> = {}
  cols.forEach(c => { monthlyJournals[c.key] = 0 })
  return { unexported: 0, monthlyJournals, currentYearJournals: 0, lastYearJournals: 0 }
}

// =============================================
// モジュールスコープキャッシュ
// =============================================

const journalSummaryCache = new Map<string, JournalSummary>()
let cacheInitialized = false

// =============================================
// Composable
// =============================================

export function useProgress() {
    const { clients: allClients } = useClients();
    const { staffList } = useStaff();
    const { allDocuments } = useDocuments();
    const monthColumns = useMonthColumns(12);
    const isLoading = ref(!cacheInitialized);

    // 初回のみサーバーから仕訳サマリを取得（全顧問先分）
    if (!cacheInitialized) {
        cacheInitialized = true
        // 全顧問先の仕訳サマリを並列取得
        const loadSummaries = async () => {
            isLoading.value = true
            const cols = monthColumns.value
            const clientList = allClients.value
            // 3並列で取得（サーバー負荷制限）
            const CONCURRENCY = 3
            for (let i = 0; i < clientList.length; i += CONCURRENCY) {
                const batch = clientList.slice(i, i + CONCURRENCY)
                await Promise.all(batch.map(async (c) => {
                    if (!journalSummaryCache.has(c.clientId)) {
                        const summary = await fetchJournalSummary(c.clientId, cols)
                        journalSummaryCache.set(c.clientId, summary)
                    }
                }))
            }
            isLoading.value = false
            console.log(`[useProgress] ${clientList.length}件の仕訳サマリを取得完了`)
        }
        // 顧問先データのロード完了を待って取得開始
        // allClientsはリアクティブなので、値が入ったタイミングで取得
        setTimeout(() => loadSummaries(), 500)
    }

    // clientsからprogressRowsを生成（Single Source of Truth）
    // receivedDateとunsortedはDocEntry（useDocuments）から動的算出
    const progressRows = computed<ProgressRow[]>(() => {
        const cols = monthColumns.value;
        const docs = allDocuments.value;

        return allClients.value.map(c => {
            const summary = journalSummaryCache.get(c.clientId)
            const clientDocs = docs.filter(d => d.clientId === c.clientId);
            return {
                clientId: c.clientId,
                code: c.threeCode,
                status: c.status,
                type: c.type,
                fiscalMonth: c.fiscalMonth,
                companyName: c.companyName,
                repName: c.repName || '',
                receivedDate: latestReceivedDate(clientDocs),
                unsorted: countUnsorted(clientDocs),
                unexported: summary?.unexported ?? 0,
                monthlyJournals: summary?.monthlyJournals ?? emptyJournalSummary(cols).monthlyJournals,
                currentYearJournals: summary?.currentYearJournals ?? 0,
                lastYearJournals: summary?.lastYearJournals ?? 0,
            };
        });
    });

    /** ソート値取得（月列 "month_2025-04" 形式に対応） */
    function getSortValue(row: ProgressRow, key: string): string | number {
        if (key.startsWith('month_')) {
            const monthKey = key.replace('month_', '');
            return row.monthlyJournals[monthKey] || 0;
        }
        const val = row[key];
        return typeof val === 'string' || typeof val === 'number' ? val : '';
    }

    return {
        progressRows,
        monthColumns,
        staffList,
        isLoading,
        getSortValue,
    };
}
