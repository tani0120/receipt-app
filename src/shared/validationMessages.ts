/**
 * validationMessages.ts — バリデーション・エラー文言の一元管理
 *
 * 配置: src/shared/ — サーバー側・フロント側の両方からimport可能
 *
 * ルール:
 *   - 文言の追加・修正はこのファイルのみで行う
 *   - 各コンポーネントは必ずここからimportして使う
 *   - ハードコード禁止
 */

// ============================================================
// A. サーバー側バリデーション（validatePreviewExtractResult.ts で使用）
// ============================================================

/** 複数証票エラー（document_count >= 2） */
export const multiDocumentError = (count: number) =>
  `この画像には${count}枚の証票が写っています。1枚ずつ撮影してください`

/** AI処理失敗（fallback_applied） */
export const MSG_FALLBACK_ERROR = 'AI処理に失敗しました。判読できない場合は撮り直してください'

/** 取引先が読み取れない */
export const MSG_ISSUER_MISSING = '取引先が読み取れません。判読できない場合は撮り直してください'

/** 日付が読み取れない */
export const MSG_DATE_MISSING = '日付が読み取れません。判読できない場合は撮り直してください'

/** 金額が読み取れない */
export const MSG_AMOUNT_MISSING = '金額が読み取れません。判読できない場合は撮り直してください'

// ============================================================
// B. 重複チェック文言（フロントUI表示用）
// ============================================================

/** PC版リスト: 重複バッジ（詳細版） */
export const MSG_DUPLICATE_DETAIL = 'すでにアップロードしたファイルの可能性。削除してください。'

/** モバイル版オーバーレイ: 重複（短縮版） */
export const MSG_DUPLICATE_SHORT = 'アップロード済みの可能性'

// ============================================================
// C. UIガイド文言
// ============================================================

/** エラーガイド（不備件数を含む） */
export const errorGuideMessage = (count: number) =>
  `${count}件のエラーがあります。タップして再撮影 or そのまま送付 を選択してください。（判読できるならそのまま送付でOK）`

// ============================================================
// D. エラーハンドリング（receiptService.ts で使用）
// ============================================================

/** サーバーエラー */
export const serverErrorMessage = (status: number) =>
  `サーバーエラー (${status})`

/** 通信エラー（詳細あり） */
export const networkErrorMessage = (detail: string) =>
  `通信エラー: ${detail}`

// ============================================================
// E. モック用エラーリスト（VITE_USE_MOCK時に使用）
// ============================================================

/** モック用ランダムエラー文言 */
export const MOCK_ERROR_REASONS = [
  MSG_AMOUNT_MISSING,
  MSG_DATE_MISSING,
  MSG_ISSUER_MISSING,
  multiDocumentError(2),
]

// ============================================================
// F. 仕訳バリデーション警告メッセージ
//    （journalWarningSync.ts / journalValidation.ts 共通）
// ============================================================

/** 逆仕訳: 売上が借方 */
export const WARN_SALES_DEBIT = '売上は通常貸方です。返品・値引ですか？'
/** 逆仕訳: 経費が貸方 */
export const WARN_EXPENSE_CREDIT = '経費は通常借方です。戻入・返品ですか？'

/** 不正パターン: 同区分同士 */
export const WARN_SALES_SALES = '借方・貸方が同じ区分（売上×売上）です'
export const WARN_EXPENSE_EXPENSE = '借方・貸方が同じ区分（経費×経費）です'

/** 不正パターン: 売上×経費 */
export const WARN_SALES_EXPENSE = '借方が売上、貸方が経費は通常あり得ません'
export const WARN_EXPENSE_SALES = '借方が経費、貸方が売上は通常あり得ません'

/** 不正パターン: 純資産組合せ */
export const WARN_EQUITY_SALES = '純資産×売上の組み合わせは通常あり得ません'
export const WARN_EQUITY_EXPENSE = '純資産×経費の組み合わせは通常あり得ません'
export const WARN_SALES_EQUITY = '売上×純資産の組み合わせは通常あり得ません'
export const WARN_EXPENSE_EQUITY = '経費×純資産の組み合わせは通常あり得ません'
export const WARN_EQUITY_EQUITY = '純資産×純資産の組み合わせは通常あり得ません'

/** 証票意味ルール違反（テンプレート） */
export const warnVoucherTypeDebit = (voucherType: string, accountName: string) =>
  `${voucherType}の借方に「${accountName}」は通常使用しません`
export const warnVoucherTypeCredit = (voucherType: string, accountName: string) =>
  `${voucherType}の貸方に「${accountName}」は通常使用しません`

// ── 同期警告（syncWarningLabelsCore）──

/** マスタ未存在 */
export const warnAccountUnknown = (items: string[]) =>
  `${items.join(', ')}がマスタに存在しません`
/** 税区分未設定 */
export const warnTaxEmpty = (side: string, idx: number) =>
  `${side}${idx}行目の税区分が未設定です`
/** 税区分マスタ未存在 */
export const warnTaxUnknown = (items: string[]) =>
  `${items.join(', ')}が税区分マスタに存在しません`
/** 摘要空 */
export const WARN_DESCRIPTION_EMPTY = '摘要が空です'
/** 日付空 */
export const WARN_DATE_EMPTY = '日付が空です'
/** 金額未設定 */
export const warnAmountEmpty = (items: string[]) =>
  `${items.join(', ')}の金額が未設定です`
/** 貸借不一致 */
export const warnDebitCreditMismatch = (debit: string, credit: string) =>
  `借方合計${debit} ≠ 貸方合計${credit}`
/** 借方貸方同一科目 */
export const warnSameAccountBothSides = (accounts: string[]) =>
  `'${accounts.join("', '")}'が借方と貸方の両方に使用されています`
/** 税区分と科目の不整合 */
export const WARN_TAX_ACCOUNT_MISMATCH = '科目に設定された税区分と異なる税区分が使用されています'

/** ファイルサイズ超過 */
export const warnFileSizeTooLarge = (sizeMB: string) =>
  `ファイルサイズが大きすぎます（${sizeMB}MB）。10MB以下にしてください`
/** AI分析失敗 */
export const WARN_AI_ANALYSIS_FAILED = 'AI分析に失敗しました（サーバー側エラー）'

// ============================================================
// G. ヒント検証メッセージ（journalHintService.ts で使用）
// ============================================================

/** 借方科目マスタ未存在 */
export const hintDebitAccountUnknown = (account: string) =>
  `借方科目【${account}】はマスタに存在しません`
/** 貸方科目マスタ未存在 */
export const hintCreditAccountUnknown = (account: string) =>
  `貸方科目【${account}】はマスタに存在しません`
/** 勘定科目未設定 */
export const HINT_ACCOUNT_UNKNOWN = '勘定科目が未設定または不明です'
/** 税区分未設定 */
export const HINT_TAX_UNKNOWN = '税区分が未設定または不明です'
/** 摘要未設定 */
export const HINT_DESCRIPTION_EMPTY = '摘要が未設定です'
/** 日付未設定 */
export const HINT_DATE_EMPTY = '日付が未設定です'
/** 金額未設定 */
export const HINT_AMOUNT_EMPTY = '金額が未設定のエントリがあります'
/** 貸借不一致 */
export const hintDebitCreditMismatch = (debit: string, credit: string) =>
  `貸借不一致: 借方合計 ${debit} ≠ 貸方合計 ${credit}`
/** 科目組合せ矛盾 */
export const HINT_CATEGORY_CONFLICT = '借方・貸方の勘定科目の組み合わせに矛盾があります'
/** 借方貸方同一科目 */
export const HINT_SAME_ACCOUNT = '借方と貸方に同一の勘定科目が使用されています'
/** 証票意味ルール不適切（ルールあり） */
export const hintVoucherTypeConflict = (voucherType: string, description: string) =>
  `証票意味【${voucherType}】に対して不適切な科目があります\n${description}`
/** 証票意味ルール不適切（ルールなし） */
export const HINT_VOUCHER_TYPE_GENERIC = '証票意味に対して不適切な科目があります'
/** 税区分方向不一致 */
export const HINT_TAX_ACCOUNT_DIRECTION = '税区分と勘定科目の方向（売上/仕入）が一致しません'
/** 未来日付 */
export const hintFutureDate = (date: string) =>
  `未来日付です（${date}）。日付を確認してください`

// ── フィールドラベル（ヒント候補表示用）──
export const FIELD_ACCOUNT = '勘定科目'
export const FIELD_TAX_CATEGORY = '税区分'
export const FIELD_AMOUNT = '金額'
export const FIELD_AMOUNT_DIFF = '金額（差額）'
export const LABEL_UNSET = '未設定'
