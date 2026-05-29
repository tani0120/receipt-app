/**
 * mfFieldMapping.ts — MF → sugusuru フィールドマッピング定義
 *
 * MFが正（Single Source of Truth）:
 *   MFに値があれば sugusuru を上書き
 *   MFに値がなければ sugusuru の手入力値を維持
 *
 * 全コード値は2026-05-24にMF実データから実測確認済み
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MF tax_method → sugusuru consumptionTaxMode
// MF画面: 免税事業者 / 簡易課税 / 原則課税(一括比例配分方式) / 原則課税(個別対応方式)
// ※ GENERAL はMF画面に選択肢なし（旧仕様 or 内部状態の可能性）
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const TAX_METHOD_MAP: Record<string, string> = {
  'FREE':                      'exempt',                  // 免税事業者
  'SIMPLE':                    'simplified',              // 簡易課税（★ドキュメントのSIMPLIFIEDは誤り）
  'INDIVIDUAL_ALLOCATION':     'individual',              // 原則課税（個別対応方式）
  'PROPORTIONAL_ALLOCATION':   'proportional',            // 原則課税（一括比例配分方式）
  // フォールバック: ドキュメント記載の値（実環境で出現する可能性は低い）
  'SIMPLIFIED':                'simplified',              // ドキュメント記載値（実測ではSIMPLE）
  'GENERAL':                   'individual',              // ドキュメント記載値（MF画面に選択肢なし）
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MF office.type → sugusuru type
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const OFFICE_TYPE_MAP: Record<string, string> = {
  'INDIVIDUAL': 'individual',  // 個人事業主
  'CORPORATE':  'corp',        // 法人
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MF business_types → sugusuru industry（名寄せテーブル）
// MF: 複数選択可（配列）、sugusuru: 単一選択
// → 最初の1件を使用
// 全13種 2026-05-24 実測確認済み
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const BUSINESS_TYPE_MAP: Record<string, string> = {
  'MANUFACTURING':             '製造業',
  'EDUCATION':                 '教育',
  'MEDICAL_WELFARE':           '医療/福祉',
  'INFORMATION_COMMUNICATION': '情報通信',
  'FOOD_SERVICE':              '飲食業',
  'CONSTRUCTION':              '建設業',
  'TRANSPORTATION':            '運送業',
  'WHOLESALE':                 '卸売業',
  'RETAIL':                    '小売業',
  'FINANCE_INSURANCE':         '金融保険業',
  'REAL_ESTATE':               '不動産業',
  'SERVICES':                  'サービス業',
  'OTHER':                     'その他',
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MF employee_count → sugusuru employeeCount（概算中央値）
// 法人のみ。個人にはフィールドなし。
// 全8区分 2026-05-24 実測確認済み（パターン: RANGE_{min}_{max}）
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const EMPLOYEE_COUNT_MAP: Record<string, number | null> = {
  'NOT_SELECTED':  null,   // 未選択
  'OWNER_ONLY':    1,      // 経営者のみ（実測）
  'RANGE_1_5':     3,      // 1〜5人（実測）
  'RANGE_6_10':    8,      // 6〜10人（実測）
  'RANGE_11_30':   20,     // 11〜30人（パターン推定）
  'RANGE_31_50':   40,     // 31〜50人（パターン推定）
  'RANGE_51_100':  75,     // 51〜100人（パターン推定）
  'RANGE_101_OVER': 150,   // 101人以上（パターン推定）
  // フォールバック候補
  'OVER_101':      150,    // 101人以上（別パターン）
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MF accounting_method → sugusuru taxMethod（税込/税抜）
// 法人のみ。個人にはフィールドなし。
// 全3種 2026-05-24 実測確認済み
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const ACCOUNTING_METHOD_MAP: Record<string, string> = {
  'TAX_INCLUDED':           'tax_included',           // 税込（実測）
  'TAX_EXCLUDED_INCLUDED':  'tax_excluded_included',  // 税抜（内税）（実測）
  'TAX_EXCLUDED_SEPARATE':  'tax_excluded_separate',  // 税抜（別記）（実測）
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 売上実額 → sugusuru annualRevenue レンジ変換
// PL推移表から売上高を取得した場合に使用（将来実装）
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export function revenueToRange(amount: number): string {
  if (amount < 3_000_000) return 'under_3m'
  if (amount < 5_000_000) return '3m_to_5m'
  if (amount < 10_000_000) return '5m_to_10m'
  if (amount < 30_000_000) return '10m_to_30m'
  if (amount < 100_000_000) return '30m_to_100m'
  if (amount < 500_000_000) return '100m_to_500m'
  if (amount < 1_000_000_000) return '500m_to_1b'
  return 'over_1b'
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// マッピング実行ヘルパー
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import type { MfMcpOffice, MfMcpTermSettings } from '../api/services/mfMcpClient'

/** MF事業者情報からsugusuruフィールドへの変換結果 */
export interface MfMappingResult {
  /** 変更されたフィールドのキーと値 */
  updates: Record<string, unknown>
  /** 変更内容の日本語ログ */
  changes: string[]
}

/**
 * MF事業者情報（currentOffice）からsugusuruフィールドを自動マッピング
 * @param office MCP currentOffice レスポンス
 * @param currentClient 現在のclientデータ（差分検出用）
 */
export function mapOfficeToClient(
  office: MfMcpOffice,
  currentClient: Record<string, unknown>,
): MfMappingResult {
  const updates: Record<string, unknown> = {}
  const changes: string[] = []

  // 事業者名 → 法人はcompanyName、個人はrepNameにマッピング
  // MFのnameは事業者名1つのみ（代表者名/会社名の区別なし）
  if (office.name) {
    const clientType = (currentClient.type as string) || ''
    if (clientType === 'individual' || clientType === 'sole_proprietor') {
      // 個人: 事業者名 → repName（代表者名/屋号）
      if (office.name !== currentClient.repName) {
        changes.push(`代表者名: ${currentClient.repName || '(空)'} → ${office.name}`)
        updates.repName = office.name
      }
    } else {
      // 法人: 事業者名 → companyName（会社名）
      if (office.name !== currentClient.companyName) {
        changes.push(`会社名: ${currentClient.companyName || '(空)'} → ${office.name}`)
        updates.companyName = office.name
      }
    }
  }

  // 個人/法人判定
  if (office.type) {
    const mfType = OFFICE_TYPE_MAP[office.type]
    if (mfType && mfType !== currentClient.type) {
      const typeLabel = (t: string) => t === 'individual' ? '個人' : t === 'corp' ? '法人' : t
      changes.push(`区分: ${typeLabel(currentClient.type as string)} → ${typeLabel(mfType)}`)
      updates.type = mfType
    }
  }

  // 不動産所得（個人のみ）
  if (office.is_real_estate != null && office.is_real_estate !== currentClient.hasRentalIncome) {
    changes.push(`不動産所得: ${currentClient.hasRentalIncome ? 'あり' : 'なし'} → ${office.is_real_estate ? 'あり' : 'なし'}`)
    updates.hasRentalIncome = office.is_real_estate
  }

  // 従業員数（法人のみ）
  if (office.employee_count) {
    const count = EMPLOYEE_COUNT_MAP[office.employee_count]
    if (count !== undefined && count !== currentClient.employeeCount) {
      changes.push(`従業員数: ${currentClient.employeeCount ?? '(未設定)'} → ${count ?? '(未選択)'}`)
      updates.employeeCount = count
    }
  }

  // 決算月日（会計期間から抽出）
  if (office.accounting_periods?.length) {
    const latest = office.accounting_periods[0]
    if (latest?.end_date) {
      const endDate = new Date(latest.end_date)
      const mfFiscalMonth = endDate.getMonth() + 1
      const mfFiscalDay = endDate.getDate()
      if (currentClient.fiscalMonth !== mfFiscalMonth) {
        changes.push(`決算月: ${currentClient.fiscalMonth || '(未設定)'}月 → ${mfFiscalMonth}月`)
        updates.fiscalMonth = mfFiscalMonth
      }
      if (currentClient.fiscalDay !== mfFiscalDay) {
        changes.push(`決算日: ${currentClient.fiscalDay || '(未設定)'}日 → ${mfFiscalDay}日`)
        updates.fiscalDay = mfFiscalDay
      }
    }
  }

  return { updates, changes }
}

/**
 * MF会計年度設定（getTermSettings）からsugusuruフィールドを自動マッピング
 * @param termSettings MCP getTermSettings レスポンス（最新年度の1件）
 * @param currentClient 現在のclientデータ（差分検出用）
 */
export function mapTermSettingsToClient(
  termSettings: MfMcpTermSettings,
  currentClient: Record<string, unknown>,
): MfMappingResult {
  const updates: Record<string, unknown> = {}
  const changes: string[] = []

  // 課税形式
  if (termSettings.tax_method) {
    const mapped = TAX_METHOD_MAP[termSettings.tax_method]
    if (mapped && mapped !== currentClient.consumptionTaxMode) {
      const label = (v: string) => {
        const labels: Record<string, string> = {
          exempt: '免税', simplified: '簡易課税',
          individual: '原則課税（個別対応）',
          proportional: '原則課税（一括比例）',
          general: '原則課税',
        }
        return labels[v] ?? v
      }
      changes.push(`課税方式: ${label(currentClient.consumptionTaxMode as string ?? '')} → ${label(mapped)}`)
      updates.consumptionTaxMode = mapped
    }
  }

  // 経理方式（法人のみ）
  if (termSettings.accounting_method) {
    const mapped = ACCOUNTING_METHOD_MAP[termSettings.accounting_method]
    if (mapped && mapped !== currentClient.taxMethod) {
      changes.push(`経理方式: ${currentClient.taxMethod || '(未設定)'} → ${mapped}`)
      updates.taxMethod = mapped
    }
  }

  // 業種（配列→単一選択・最初の1件）
  if (termSettings.business_types?.length) {
    const firstType = termSettings.business_types[0]
    if (firstType) {
      const mapped = BUSINESS_TYPE_MAP[firstType]
      if (mapped && mapped !== currentClient.industry) {
        changes.push(`業種: ${currentClient.industry || '(未設定)'} → ${mapped}`)
        updates.industry = mapped
      }
    }
  }

  return { updates, changes }
}

/**
 * 部門一覧から部門管理フラグを自動判定
 * @param departmentCount 部門の件数
 * @param currentClient 現在のclientデータ（差分検出用）
 */
export function mapDepartmentsToClient(
  departmentCount: number,
  currentClient: Record<string, unknown>,
): MfMappingResult {
  const updates: Record<string, unknown> = {}
  const changes: string[] = []

  const hasDept = departmentCount > 0
  if (hasDept !== currentClient.hasDepartmentManagement) {
    changes.push(`部門管理: ${currentClient.hasDepartmentManagement ? 'あり' : 'なし'} → ${hasDept ? 'あり' : 'なし'}`)
    updates.hasDepartmentManagement = hasDept
  }

  return { updates, changes }
}


