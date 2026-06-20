/**
 * 補助科目エントリ型（フロント/バックエンド共有）
 *
 * MFクラウドから取得した補助科目データの構造体。
 * clientAccountStore / useAccountSettings / JournalListLevel3Mock で使用。
 *
 * 対応するバックエンド型: MfSubAccountEntry（api/services/accountMasterApi.ts）
 */
export interface SubAccountEntry {
  /** MF補助科目ID（URLエンコード済みBase64） */
  mfSubId: string
  /** 補助科目名 */
  name: string
  /** MFデフォルト税区分ID */
  mfTaxId: string
  /** sugusuru税区分ID（変換済み） */
  taxCategoryId?: string
  /** 検索キー */
  searchKey?: string | null
}
