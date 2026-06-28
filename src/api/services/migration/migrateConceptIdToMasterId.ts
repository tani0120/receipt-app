/**
 * 英語概念ID → 正規マスタIDへの移行
 *
 * entry.accountに混在していた英語概念ID（cash, consumables等）を
 * 正規マスタID（GENKIN_IND, SHOUMOUHINHI_IND等）に置換する。
 *
 * 実測（2026-06-27）:
 *   - 対象: journals-c_wTdnMKDO.json（1顧問先のみ）
 *   - 英語概念ID: cash（2件）, consumables（2件）
 *   - 顧問先事業種別: individual（個人事業主）→ _IND サフィックス
 *   - 発生源: パイプライン実装前の旧データ（source: 'legacy'）。現在のコードでは生成されない
 *
 * 起動時に loadClient() から1回だけ呼ばれる。
 * 変更があった場合のみ true を返す（呼び出し元が save() を実行する）。
 */

import { isIndividualType } from '../../../constants/clientOptions'

/** 英語概念ID → 正規マスタIDのマッピング（個人系用） */
const CONCEPT_TO_MASTER_IND: Record<string, string> = {
  cash: 'GENKIN_IND',
  consumables: 'SHOUMOUHINHI_IND',
}

/** 英語概念ID → 正規マスタIDのマッピング（法人用） */
const CONCEPT_TO_MASTER_CORP: Record<string, string> = {
  cash: 'GENKIN_CORP',
  consumables: 'BIHINSHOUMOUHINHI_CORP',
}

/**
 * 英語概念IDを正規マスタIDに移行する
 *
 * @param journals 仕訳配列
 * @param clientType 顧問先の事業者種別（Client.type の生値。isIndividualType()で判定）
 * @returns 変更があった場合 true
 */
export function migrateConceptIdToMasterId(
  journals: Record<string, unknown>[],
  clientType: string | null | undefined = null
): boolean {
  const mapping = isIndividualType(clientType)
    ? CONCEPT_TO_MASTER_IND
    : CONCEPT_TO_MASTER_CORP

  let changed = false
  let count = 0

  for (const journal of journals) {
    const debitEntries = journal.debit_entries as Array<Record<string, unknown>> | undefined
    const creditEntries = journal.credit_entries as Array<Record<string, unknown>> | undefined

    for (const entries of [debitEntries, creditEntries]) {
      if (!entries) continue
      for (const entry of entries) {
        const account = entry.account as string | null | undefined
        if (account && mapping[account]) {
          entry.account = mapping[account]
          changed = true
          count++
        }
      }
    }
  }

  if (changed) {
    console.log(
      `[migrateConceptIdToMasterId] 英語概念ID → 正規マスタIDに${count}件を移行しました`
    )
  }
  return changed
}

