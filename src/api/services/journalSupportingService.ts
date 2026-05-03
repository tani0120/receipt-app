/**
 * journalSupportingService.ts — 証票マッチングサービス（API側）
 *
 * Phase 1 Step 6-B1（2026-05-03）
 * JournalListLevel3Mock.vue の matchScore / supportingMatchMap を移植。
 *
 * 依存:
 *   - journalStore.ts（仕訳データ取得）
 *   - drive.ts の search-supporting API（根拠メタデータ取得）
 */

// ────────────────────────────────────────────
// 型定義
// ────────────────────────────────────────────

/** 根拠資料メタ情報 */
export interface SupportingMetaItem {
  id: string
  fileName: string
  previewUrl: string
  date: string | null
  amount: number | null
  vendor: string | null
  description: string | null
  sourceType: string | null
}

/** マッチング対象の仕訳最小インターフェース */
export interface JournalForMatching {
  id: string
  voucher_date: string | null
  description: string
  vendor_name?: string | null
  status?: string
  deleted_at?: string | null
  debit_entries: { amount: number | null }[]
  credit_entries: { amount: number | null }[]
}

/** マッチング結果レスポンス */
export interface SupportingMatchResponse {
  matches: Record<string, SupportingMetaItem[]>
  totalJournals: number
  totalMeta: number
  matchedCount: number
}

// ────────────────────────────────────────────
// マッチングスコア算出
// ────────────────────────────────────────────

/**
 * 仕訳と根拠資料のマッチングスコア算出
 * 日付一致 +3、取引先一致 +3、金額一致 +3
 * スコア3以上で紐づけ成功（1条件以上の完全一致）
 */
export function matchScore(journal: JournalForMatching, meta: SupportingMetaItem): number {
  let score = 0

  // 日付マッチ（完全一致 or 年月一致）
  if (journal.voucher_date && meta.date) {
    if (journal.voucher_date === meta.date) {
      score += 3
    } else if (journal.voucher_date.slice(0, 7) === meta.date.slice(0, 7)) {
      score += 1 // 月一致
    }
  }

  // 取引先マッチ（部分一致）
  if (meta.vendor && meta.vendor.length >= 2) {
    const vendorLower = meta.vendor.toLowerCase()
    if (journal.vendor_name && journal.vendor_name.toLowerCase().includes(vendorLower)) {
      score += 3
    } else if (journal.description.toLowerCase().includes(vendorLower)) {
      score += 2
    }
  }

  // 金額マッチ（仕訳の借方合計 or 貸方合計 = 根拠のamount）
  if (meta.amount != null && meta.amount > 0) {
    const debitTotal = journal.debit_entries.reduce((s, e) => s + (e.amount || 0), 0)
    const creditTotal = journal.credit_entries.reduce((s, e) => s + (e.amount || 0), 0)
    if (debitTotal === meta.amount || creditTotal === meta.amount) {
      score += 3
    }
  }

  return score
}

// ────────────────────────────────────────────
// 全件マッチング
// ────────────────────────────────────────────

/**
 * 全仕訳 × 全根拠資料のN×Mマッチングを実行し、
 * journalId → マッチした根拠資料の配列 のマップを返す。
 *
 * 未出力仕訳のみ対象（exported / deleted_at は除外）
 */
export function getSupportingMatches(
  journals: JournalForMatching[],
  supportingMeta: SupportingMetaItem[],
): SupportingMatchResponse {
  const matches: Record<string, SupportingMetaItem[]> = {}
  let matchedCount = 0

  for (const journal of journals) {
    // 未出力仕訳のみ対象
    if (journal.status === 'exported' || journal.deleted_at) continue

    const journalMatches: SupportingMetaItem[] = []
    for (const meta of supportingMeta) {
      if (matchScore(journal, meta) >= 3) {
        journalMatches.push(meta)
      }
    }
    if (journalMatches.length > 0) {
      matches[journal.id] = journalMatches
      matchedCount++
    }
  }

  return {
    matches,
    totalJournals: journals.length,
    totalMeta: supportingMeta.length,
    matchedCount,
  }
}
