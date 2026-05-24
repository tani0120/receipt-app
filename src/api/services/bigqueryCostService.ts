/**
 * bigqueryCostService.ts — BigQuery Billing Export からGCPコストを取得
 *
 * レイヤー: ★service★ → BigQuery API
 * 責務: GCP課金データの取得と集計（管理画面costタブ用）
 *
 * 認証: GOOGLE_SA_KEY_PATH のサービスアカウントキーを使用
 * キャッシュ: 1時間TTL（BigQueryデータ反映ラグを考慮）
 *
 * 環境変数:
 *   BQ_BILLING_PROJECT_ID — BigQueryプロジェクトID（デフォルト: VERTEX_PROJECT_ID）
 *   BQ_BILLING_DATASET    — Billing Exportデータセット名
 *   BQ_BILLING_TABLE      — Billing Exportテーブル名（例: gcp_billing_export_v1_XXXXXX）
 *
 * 準拠: load_context.md L130: ロジックはAPI側に書け
 */

import { BigQuery } from '@google-cloud/bigquery'

// ============================================================
// 設定
// ============================================================

const BQ_PROJECT = process.env['BQ_BILLING_PROJECT_ID'] ?? process.env['VERTEX_PROJECT_ID'] ?? ''
const BQ_DATASET = process.env['BQ_BILLING_DATASET'] ?? ''
const BQ_TABLE = process.env['BQ_BILLING_TABLE'] ?? ''

/** BigQuery Billing Exportが設定済みかどうか */
export function isBqConfigured(): boolean {
  return !!(BQ_PROJECT && BQ_DATASET && BQ_TABLE)
}

// ============================================================
// 型定義
// ============================================================

/** 月別サービス別コスト */
export interface BqMonthlyCost {
  /** 年月（"2026-05"） */
  yearMonth: string
  /** サービス名（"Vertex AI"等） */
  service: string
  /** SKU名 */
  sku: string
  /** 正味コスト（USD） */
  netCostUsd: number
  /** 正味コスト（JPY、USD×150） */
  netCostJpy: number
}

/** 月別サマリ */
export interface BqMonthlySummary {
  yearMonth: string
  totalCostUsd: number
  totalCostJpy: number
  byService: { service: string; costUsd: number; costJpy: number }[]
}

// ============================================================
// キャッシュ
// ============================================================

const USD_JPY = 150
const CACHE_TTL_MS = 60 * 60 * 1000 // 1時間
let cachedData: BqMonthlyCost[] | null = null
let cachedAt = 0

// ============================================================
// BigQueryクライアント
// ============================================================

let _bq: BigQuery | null = null
function getBqClient(): BigQuery {
  if (!_bq) {
    const saKeyPath = process.env['GOOGLE_SA_KEY_PATH']
    _bq = saKeyPath
      ? new BigQuery({ projectId: BQ_PROJECT, keyFilename: saKeyPath })
      : new BigQuery({ projectId: BQ_PROJECT })
  }
  return _bq
}

// ============================================================
// データ取得
// ============================================================

/**
 * BigQueryからGCPコストデータを取得（キャッシュ付き）
 * 過去12ヶ月分を取得
 */
async function fetchBillingData(): Promise<BqMonthlyCost[]> {
  const now = Date.now()
  if (cachedData && (now - cachedAt < CACHE_TTL_MS)) {
    return cachedData
  }

  if (!isBqConfigured()) {
    console.warn('[bigqueryCostService] BQ_BILLING_TABLE が未設定。空データを返します')
    return []
  }

  const fullTable = `\`${BQ_PROJECT}.${BQ_DATASET}.${BQ_TABLE}\``

  const query = `
    SELECT
      FORMAT_TIMESTAMP('%Y-%m', usage_start_time) AS year_month,
      service.description AS service,
      sku.description AS sku,
      SUM(cost) + SUM(IFNULL((SELECT SUM(c.amount) FROM UNNEST(credits) c), 0)) AS net_cost
    FROM ${fullTable}
    WHERE
      (service.description LIKE '%Vertex%'
       OR service.description LIKE '%Gemini%'
       OR service.description LIKE '%AI Platform%'
       OR service.description LIKE '%Cloud AI%')
      AND usage_start_time >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 365 DAY)
    GROUP BY 1, 2, 3
    HAVING net_cost > 0
    ORDER BY 1 DESC, 4 DESC
  `

  try {
    const bq = getBqClient()
    const [rows] = await bq.query({ query })
    const results: BqMonthlyCost[] = (rows as Record<string, unknown>[]).map(row => ({
      yearMonth: String(row['year_month'] ?? ''),
      service: String(row['service'] ?? ''),
      sku: String(row['sku'] ?? ''),
      netCostUsd: Number(row['net_cost'] ?? 0),
      netCostJpy: Number(row['net_cost'] ?? 0) * USD_JPY,
    }))

    cachedData = results
    cachedAt = now
    console.log(`[bigqueryCostService] BigQuery取得完了: ${results.length}行`)
    return results
  } catch (err) {
    console.error('[bigqueryCostService] BigQueryクエリ失敗:', err)
    return cachedData ?? [] // キャッシュがあれば返す
  }
}

// ============================================================
// 公開API
// ============================================================

/**
 * 月別サマリを取得（管理画面costタブ用）
 * 過去12ヶ月分、月ごとにサービス別内訳付き
 */
export async function getMonthlySummaries(): Promise<BqMonthlySummary[]> {
  const data = await fetchBillingData()

  // 月ごとにグループ化
  const byMonth = new Map<string, BqMonthlyCost[]>()
  for (const row of data) {
    const existing = byMonth.get(row.yearMonth) ?? []
    existing.push(row)
    byMonth.set(row.yearMonth, existing)
  }

  const summaries: BqMonthlySummary[] = []
  for (const [yearMonth, rows] of byMonth) {
    // サービス別集計
    const serviceMap = new Map<string, number>()
    let totalUsd = 0
    for (const row of rows) {
      totalUsd += row.netCostUsd
      serviceMap.set(row.service, (serviceMap.get(row.service) ?? 0) + row.netCostUsd)
    }

    summaries.push({
      yearMonth,
      totalCostUsd: Math.round(totalUsd * 100) / 100,
      totalCostJpy: Math.round(totalUsd * USD_JPY),
      byService: [...serviceMap.entries()].map(([service, costUsd]) => ({
        service,
        costUsd: Math.round(costUsd * 100) / 100,
        costJpy: Math.round(costUsd * USD_JPY),
      })),
    })
  }

  return summaries.sort((a, b) => b.yearMonth.localeCompare(a.yearMonth))
}

/**
 * 今月のGCP確定コストを取得
 */
export async function getCurrentMonthCost(): Promise<BqMonthlySummary | null> {
  const now = new Date()
  const currentYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const summaries = await getMonthlySummaries()
  return summaries.find(s => s.yearMonth === currentYM) ?? null
}
