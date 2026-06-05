/**
 * taxIdGenerator.ts — MF税区分名→すぐするマスタID変換（ルールベース・データ駆動）
 *
 * レイヤー: ★service★
 * 責務: MFの日本語税区分名から、既存151件と一貫した英語マスタIDを生成する
 *
 * 設計方針:
 *   - 全てルールベース。AI推論は使わない
 *   - 変換テーブルはdata/tax-id-rules.jsonに外出し（データ駆動）
 *   - ルール追加はJSONに1行追加するだけ。コード変更不要
 *   - 既存151件の命名規則に完全準拠（検証済み: 151/151件一致）
 *   - ルールに当てはまらない場合はnullを返す（呼び出し元で警告処理）
 *
 * 準拠:
 *   - MCP実機データ（mf_id_full_comparison.md）で確認済みの事実に基づく
 *   - MFのIDは事業者固有のため使用不可。名前ベースで生成する
 *
 * Supabase移行時: JSONファイルをDBテーブルに差し替えるだけ
 */

import { readFileSync } from 'fs'
import { join } from 'path'

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// データ駆動: JSONから変換テーブルを読み込み
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface TaxIdRulesData {
  /** 日本語プレフィックス→英語プレフィックス変換テーブル（長い順にソート必須） */
  prefixRules: Array<[string, string]>
  /** 簡易課税種別（一種〜六種）→ サフィックス */
  simplifiedTypeMap: Record<string, string>
}

/** JSONファイルからルールを読み込み（起動時に1回だけ） */
function loadRules(): TaxIdRulesData {
  const filePath = join(process.cwd(), 'data', 'tax-id-rules.json')
  const raw = readFileSync(filePath, 'utf-8')
  const data = JSON.parse(raw) as TaxIdRulesData
  console.log(`[taxIdGenerator] 変換ルール読み込み: ${data.prefixRules.length}件のプレフィックスルール`)
  return data
}

/** キャッシュ（サーバー起動中は不変） */
let cachedRules: TaxIdRulesData | null = null

function getRules(): TaxIdRulesData {
  if (!cachedRules) {
    cachedRules = loadRules()
  }
  return cachedRules
}

/** キャッシュをクリアしてJSONを再読み込みする（ルール追加時に呼び出し） */
export function reloadTaxIdRules(): void {
  cachedRules = null
  getRules() // 即座に再読み込み
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 公開API
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * MFの日本語税区分名から、すぐするマスタIDを生成する
 *
 * 変換ルール:
 *   1. プレフィックス: 日本語税区分種別 → 英語プレフィックス（最長一致）
 *   2. 軽減税率: (軽) → _REDUCED（TAXABLEがある場合はTAXABLEを置換）
 *   3. 税率: N% → _N（小数点は_で区切る。7.8%→_7_8）
 *   4. 簡易課税種別: 一種〜六種 → _T1〜_T6
 *
 * @param name MFの税区分名（例: 「課税売上 10%」）
 * @returns マスタID（例: 「SALES_TAXABLE_10」）。ルール不一致の場合はnull
 *
 * @example
 * generateTaxMasterId('課税売上 10%')          // → 'SALES_TAXABLE_10'
 * generateTaxMasterId('課税売上 (軽)8% 一種')   // → 'SALES_REDUCED_8_T1'
 * generateTaxMasterId('輸入仕入-消費税額 7.8%') // → 'IMPORT_TAX_7_8'
 * generateTaxMasterId('不明')                   // → 'COMMON_UNKNOWN'
 * generateTaxMasterId('見たことない税区分')      // → null
 */
export function generateTaxMasterId(name: string): string | null {
  const rules = getRules()

  for (const [jp, en] of rules.prefixRules) {
    if (!name.startsWith(jp)) continue

    const rest = name.slice(jp.length).trim()

    // プレフィックスのみで完結する税区分（対象外、不明、非課税売上 等）
    if (!rest) return en

    // 軽減税率判定
    const isReduced = rest.includes('(軽)')

    // 税率抽出（例: 10, 8, 7.8, 6.24, 1.76）
    const rateMatch = rest.match(/([0-9]+(?:\.[0-9]+)?)%/)

    // 簡易課税種別抽出（一種〜六種）
    const typeMatch = rest.match(/(一|二|三|四|五|六)種/)

    // ID構築
    let id = en

    // 軽減税率: TAXABLE → REDUCED に置換。TAXABLEがなければ末尾に追加
    if (isReduced) {
      if (id.includes('_TAXABLE')) {
        id = id.replace('_TAXABLE', '_REDUCED')
      } else {
        id += '_REDUCED'
      }
    }

    // 税率サフィックス（小数点は_で区切る: 7.8→7_8, 6.24→6_24）
    if (rateMatch && rateMatch[1]) {
      const rate = rateMatch[1].replace('.', '_')
      id += '_' + rate
    }

    // 簡易課税種別サフィックス
    if (typeMatch && typeMatch[1]) {
      const suffix = rules.simplifiedTypeMap[typeMatch[1]]
      if (suffix) {
        id += '_' + suffix
      }
    }

    return id
  }

  // どのルールにも当てはまらない → null（呼び出し元で警告処理）
  return null
}
