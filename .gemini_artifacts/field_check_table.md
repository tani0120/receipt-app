# typeDefinitionsData.ts 全フィールドチェック表

- 検証日時: 2026-04-26T02:43:38.815Z
- 総フィールド数: 108
- セクション数: 15

## A. ファイルメタデータ（基本情報）

| # | field | label | tsType | uO | uD | sO | sD | pA | tR | hI | jL | oM | oC | oSC | oST |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | id | ファイルID | string | ✅ | ✅ | ✅ | ✅ | — | — | — | ✅ | — | — | — | — |
| 2 | fileName | ファイル名 | string | ✅ | ✅ | ✅ | ✅ | — | — | — | — | — | — | — | — |
| 3 | fileType | MIMEタイプ | string | ✅ | ✅ | ✅ | ✅ | — | — | — | — | — | — | — | — |
| 4 | fileSize | サイズ | number | ✅ | ✅ | ✅ | ✅ | — | — | — | — | — | — | — | — |
| 5 | fileHash | SHA-256 | string | null | ✅ | 🔧 | ✅ | ✅ | — | — | — | — | — | — | — | — |
| 6 | receivedAt | 作成日時 | string | ✅ | ✅ | ✅ | ✅ | — | — | — | — | — | — | — | — |
| 7 | thumbnailUrl | サムネイル | string | null | ✅ | ✅ | ✅ | ✅ | — | — | — | ✅ | — | — | — | — |
| 8 | previewUrl | プレビュー | string | null | ✅ | ✅ | ✅ | ✅ | — | — | — | ✅ | — | — | — | — |
| 9 | driveFileId | DriveID | string | null | ⛔ | ✅ | ⛔ | ✅ | — | — | — | — | — | — | — | — |
## B. AI分類結果（classify API）

| # | field | label | tsType | uO | uD | sO | sD | pA | tR | hI | jL | oM | oC | oSC | oST |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 10 | date | 日付 | string | null | ✅ | ⛔ | ✅ | ✅ | — | — | — | ✅ | ✅ | — | — | — |
| 11 | amount | 金額 | number | null | ✅ | ⛔ | ✅ | ✅ | — | — | — | ✅ | ✅ | — | — | — |
| 12 | vendor | 取引先 | string | null | ✅ | ⛔ | ✅ | ✅ | — | — | — | ✅ | ✅ | — | — | — |
| 13 | source_type | 証票種別 | SourceType | ✅ | ⛔ | ✅ | ✅ | — | — | — | ✅ | — | — | — | — |
| 14 | direction | 仕訳方向 | Direction | ✅ | ⛔ | ✅ | ✅ | — | — | — | ✅ | ✅ | — | — | — |
| 15 | description | 摘要 | string | null | ✅ | ⛔ | ✅ | ✅ | — | — | — | ✅ | ✅ | — | — | — |
| 16 | classify_reason | 判定根拠 | string | null | ✅ | ⛔ | ✅ | ✅ | — | — | — | — | — | — | — | — |
| 17 | supplementary | 補助資料 | boolean | ✅ | ⛔ | ✅ | ✅ | — | — | — | — | — | — | — | — |
| 18 | confidence | 信頼度(2種) | number | ✅ | ⛔ | ✅ | ✅ | — | — | — | — | — | — | — | — |
| 19 | processing_mode | 処理モード | string | ✅ | ⛔ | ✅ | ✅ | — | — | — | — | — | — | — | — |
| 20 | fallback | フォールバック | boolean | ✅ | ⛔ | ✅ | ✅ | — | — | — | — | — | — | — | — |
| 21 | warning | 警告 | string | null | ✅ | ⛔ | ✅ | ✅ | — | — | — | ✅ | — | — | — | — |
| 22 | isDuplicate | 重複フラグ | boolean | ✅ | ⛔ | 🔧 | ✅ | — | — | — | ✅ | — | — | — | — |
| 23 | document_count | 証票枚数 | number | ✅ | ⛔ | ✅ | ✅ | — | — | — | — | — | — | — | — |
## C. 行データ（line_items）

| # | field | label | tsType | uO | uD | sO | sD | pA | tR | hI | jL | oM | oC | oSC | oST |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 24 | lineItems[] | 行データ配列 | Array | ✅ | ⛔ | ✅ | ✅ | 将来 | — | — | ✅ | ✅ | — | — | — |
| 25 | lineItemsCount | 行数 | number | ✅ | ⛔ | ✅ | ✅ | 将来 | — | — | — | — | — | ✅ | — |
## D. メトリクス（処理性能・費用）

| # | field | label | tsType | uO | uD | sO | sD | pA | tR | hI | jL | oM | oC | oSC | oST |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 26 | duration_ms | 処理時間 | number | ✅ | ⛔ | ✅ | ✅ | 将来 | — | — | — | — | ✅ | — | ✅ |
| 27 | tokens(3種) | トークン数 | number | ✅ | ⛔ | ✅ | ✅ | 将来 | — | — | — | — | ✅ | — | — |
| 28 | cost_yen | 利用料(円) | number | ✅ | ⛔ | ✅ | ✅ | 将来 | — | — | — | — | ✅ | — | — |
| 29 | model | AIモデル | string | ✅ | ⛔ | ✅ | ✅ | 将来 | — | — | — | — | ✅ | — | — |
| 30 | size_kb(2種) | サイズ(KB) | number | ✅ | ⛔ | ✅ | ✅ | — | — | — | — | — | — | — | — |
| 31 | reduction_pct | 削減率(%) | number | ✅ | ⛔ | ✅ | ✅ | — | — | — | — | — | — | — | — |
## E. 入口・操作者（DocEntry基本）

| # | field | label | tsType | uO | uD | sO | sD | pA | tR | hI | jL | oM | oC | oSC | oST |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 32 | clientId | 顧問先ID | string | ✅ | ✅ | ✅ | ✅ | — | — | — | ✅ | ✅ | — | ✅ | ✅ |
| 33 | source | ソース種別 | DocSource | ⛔ | ⛔ | ✅ | ✅ | — | — | — | — | — | — | — | — |
| 34 | createdBy | 操作者 | string | null | ⛔ | ⛔ | ✅ | ✅ | — | — | — | ✅ | — | — | ✅ | ✅ |
| 35 | updatedBy | 最終更新者 | string | null | ⛔ | ⛔ | ✅ | ✅ | — | — | ✅ | ✅ | — | — | — | — |
| 36 | updatedAt | 最終更新日時 | string | null | ⛔ | ⛔ | ✅ | ✅ | — | — | — | ✅ | — | — | — | — |
## F. 資料選別（選別→送出）

| # | field | label | tsType | uO | uD | sO | sD | pA | tR | hI | jL | oM | oC | oSC | oST |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 37 | status | 選別ステータス | DocStatus | ✅ | ✅ | ✅ | ✅ | — | — | — | ✅ | — | — | — | — |
| 38 | statusChangedBy | 選別操作者 | string | null | ⛔ | ⛔ | ✅ | ✅ | — | — | — | — | — | — | — | — |
| 39 | statusChangedAt | 選別日時 | string | null | ⛔ | ⛔ | ✅ | ✅ | — | — | — | — | — | — | — | — |
| 40 | batchId | バッチID | string | null | ⛔ | ⛔ | ⛔ | ⛔ | — | — | — | ✅ | 🔧 | — | — | — |
| 41 | journalId | 仕訳ID | string | null | ⛔ | ⛔ | ⛔ | ⛔ | — | — | — | ✅ | ✅ | — | ✅ | — |
## G. Drive専用（JobRow）

| # | field | label | tsType | uO | uD | sO | sD | pA | tR | hI | jL | oM | oC | oSC | oST |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 42 | job_id | 移行バッチID | string | — | — | — | ✅ | — | — | — | — | — | — | — | — |
| 43 | migration_status | 移行進捗 | string | — | — | — | ✅ | — | — | — | — | — | — | — | — |
| 44 | retry_count | リトライ | number | — | — | — | ✅ | — | — | — | — | — | — | — | — |
| 45 | last_error | 最終エラー | string | null | — | — | — | ✅ | — | — | — | — | — | — | — | — |
| 46 | storage_path | 保存先 | string | null | — | — | — | ✅ | — | — | — | — | — | — | — | — |
| 47 | downloaded_at | ZIP DL日時 | string | null | — | — | — | ✅ | — | — | — | — | — | — | — | — |
| 48 | storage_purged_at | 削除日時 | string | null | — | — | — | ✅ | — | — | — | — | — | — | — | — |
## H. マスタ型（Staff / Client / その他）

| # | field | label | tsType | uO | uD | sO | sD | pA | tR | hI | jL | oM | oC | oSC | oST |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 49 | Staff | スタッフ(5項目) | Staff | — | — | — | — | — | — | — | — | — | — | — | — |
| 50 | Client | 顧問先(42項目) | Client | — | — | — | — | — | — | — | — | — | — | — | — |
| 51 | ShareStatus | 共有設定 | ShareStatusRecord | — | — | — | — | — | — | — | — | — | — | — | — |
| 52 | Notification | アプリ通知 | AppNotification | — | — | — | — | — | — | — | — | — | — | — | — |
| 53 | ConfirmedJournal | 確定済み仕訳 | unknown | — | — | — | — | — | — | — | 🔧 | — | — | — | — |
## I. 仕訳基本情報

| # | field | label | tsType | uO | uD | sO | sD | pA | tR | hI | jL | oM | oC | oSC | oST |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 54 | journal.id | 仕訳ID | string | — | — | — | — | — | ✅ | — | ✅ | ✅ | — | ✅ | — |
| 55 | client_id | 顧問先ID | string | — | — | — | — | — | — | — | ✅ | ✅ | — | ✅ | ✅ |
| 56 | display_order | 表示順 | number | — | — | — | — | — | ✅ | — | ✅ | — | — | — | — |
| 57 | voucher_date | 証票日付 | string | null | — | — | — | — | — | — | — | ✅ | ✅ | — | — | — |
| 58 | date_on_document | 日付証票有無 | boolean | — | — | — | — | — | ✅ | — | ✅ | — | — | — | — |
| 59 | description | 摘要 | string | — | — | — | — | — | — | — | ✅ | ✅ | — | — | — |
| 60 | voucher_type | 証票意味 | string | null | — | — | — | — | — | ✅ | — | ✅ | — | — | — | — |
| 61 | document_id | 証票ID | string | null | — | — | — | — | — | ✅ | — | ✅ | — | — | — | — |
| 62 | line_id | 行ID | string | null | — | — | — | — | — | ✅ | — | ✅ | — | — | — | — |
| 63 | source_type | 証票種別 | SourceType | null | — | — | — | — | — | — | — | ✅ | — | — | — | — |
| 64 | direction | 仕訳方向 | Direction | null | — | — | — | — | — | — | — | ✅ | ✅ | — | — | — |
## J. 科目確定パイプライン

| # | field | label | tsType | uO | uD | sO | sD | pA | tR | hI | jL | oM | oC | oSC | oST |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 65 | vendor_vector | 取引先ベクトル | VendorVector | null | — | — | — | — | 🔧 | — | — | 🔧 | — | — | — | — |
| 66 | debit.account | 借方科目 | string | null | — | — | — | — | 🔧 | — | ✅ | ✅ | ✅ | — | — | — |
| 67 | debit.sub_account | 借方補助 | string | null | — | — | — | — | 🔧 | — | ✅ | ✅ | ✅ | — | — | — |
| 68 | debit.tax_category_id | 借方税区分 | string | null | — | — | — | — | 🔧 | — | ✅ | ✅ | ✅ | — | — | — |
| 69 | debit.amount | 借方金額 | number | null | — | — | — | — | — | — | — | ✅ | ✅ | — | — | — |
| 70 | debit.account_on_doc | 借方科目証票有無 | boolean | — | — | — | — | — | ✅ | — | ✅ | — | — | — | — |
| 71 | debit.amount_on_doc | 借方金額証票有無 | boolean | — | — | — | — | — | ✅ | — | ✅ | — | — | — | — |
| 72 | credit.account | 貸方科目 | string | null | — | — | — | — | 🔧 | — | ✅ | ✅ | ✅ | — | — | — |
| 73 | credit.sub_account | 貸方補助 | string | null | — | — | — | — | 🔧 | — | ✅ | ✅ | ✅ | — | — | — |
| 74 | credit.tax_category_id | 貸方税区分 | string | null | — | — | — | — | 🔧 | — | ✅ | ✅ | ✅ | — | — | — |
| 75 | credit.amount | 貸方金額 | number | null | — | — | — | — | — | — | — | ✅ | ✅ | — | — | — |
| 76 | credit.account_on_doc | 貸方科目証票有無 | boolean | — | — | — | — | — | ✅ | — | ✅ | — | — | — | — |
| 77 | credit.amount_on_doc | 貸方金額証票有無 | boolean | — | — | — | — | — | ✅ | — | ✅ | — | — | — | — |
## K. 仕訳ステータス・表示制御

| # | field | label | tsType | uO | uD | sO | sD | pA | tR | hI | jL | oM | oC | oSC | oST |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 78 | journal.status | 出力状態 | 'exported' | null | — | — | — | — | — | — | ✅ | ✅ | ✅ | — | — | — |
| 79 | is_read | 既読 | boolean | — | — | — | — | — | — | ✅ | ✅ | — | — | — | — |
| 80 | read_by | 既読者 | string | null | — | — | — | — | — | — | ✅ | ✅ | — | — | — | — |
| 81 | read_at | 既読日時 | string | null | — | — | — | — | — | — | ✅ | ✅ | — | — | — | — |
| 82 | deleted_at | 削除日時 | string | null | — | — | — | — | — | — | ✅ | ✅ | — | — | — | — |
| 83 | deleted_by | 削除者 | string | null | — | — | — | — | — | — | ✅ | ✅ | — | — | — | — |
## L. ラベル・警告・ルール

| # | field | label | tsType | uO | uD | sO | sD | pA | tR | hI | jL | oM | oC | oSC | oST |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 84 | labels | ラベル配列 | JournalLabelMock[] | — | — | — | — | — | ✅ | — | ✅ | — | — | — | — |
| 85 | warning_dismissals | 警告確認済 | string[] | — | — | — | — | — | — | ✅ | ✅ | — | — | — | — |
| 86 | warning_details | 警告詳細 | Record<string, string> | — | — | — | — | — | ✅ | — | ✅ | — | — | — | — |
| 87 | export_batch_id | 出力バッチID | string | null | — | — | — | — | — | ✅ | — | ✅ | ✅ | — | — | — |
| 88 | is_credit_card | クレカ払い | boolean | — | — | — | — | 🔧 | — | ✅ | ✅ | — | — | — | — |
| 89 | rule_id | ルールID | string | null | — | — | — | — | 🔧 | — | — | ✅ | — | — | — | — |
| 90 | rule_confidence | ルール信頼度 | number | null | — | — | — | — | 🔧 | — | — | ✅ | — | — | — | — |
## M. インボイス

| # | field | label | tsType | uO | uD | sO | sD | pA | tR | hI | jL | oM | oC | oSC | oST |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 91 | invoice_status | 適格状態 | 'qualified' | 'not_qualified' | null | — | — | — | — | 🔧 | — | — | ✅ | — | — | — | — |
| 92 | invoice_number | T番号 | string | null | — | — | — | — | 🔧 | — | — | ✅ | — | — | — | — |
## N. メモ・スタッフノート

| # | field | label | tsType | uO | uD | sO | sD | pA | tR | hI | jL | oM | oC | oSC | oST |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 93 | memo | メモ | string | null | — | — | — | — | — | — | ✅ | ✅ | — | — | — | — |
| 94 | memo_author | メモ作成者 | string | null | — | — | — | — | — | — | ✅ | ✅ | — | — | — | — |
| 95 | memo_target | メモ対象 | string | null | — | — | — | — | — | — | ✅ | ✅ | — | — | — | — |
| 96 | memo_created_at | メモ日時 | string | null | — | — | — | — | — | — | ✅ | ✅ | — | — | — | — |
| 97 | staff_notes | スタッフノート | StaffNotes | null | — | — | — | — | — | — | ✅ | ✅ | — | — | — | — |
| 98 | staff_notes_author | ノート作成者 | string | null | — | — | — | — | — | — | ✅ | ✅ | — | — | — | — |
## O. 監査・AI推定

| # | field | label | tsType | uO | uD | sO | sD | pA | tR | hI | jL | oM | oC | oSC | oST |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 99 | exported_at | 出力日時 | string | null | — | — | — | — | — | — | ✅ | ✅ | ✅ | — | — | — |
| 100 | exported_by | 出力者 | string | null | — | — | — | — | — | — | ✅ | ✅ | ✅ | — | ✅ | — |
| 101 | created_at | 作成日時 | string | null | — | — | — | — | — | ✅ | — | ✅ | — | — | — | — |
| 102 | updated_at | 更新日時 | string | null | — | — | — | — | — | ✅ | — | ✅ | — | — | — | — |
| 103 | created_by | 作成者 | string | null | — | — | — | — | — | — | — | 🔧 | — | — | — | — |
| 104 | updated_by | 更新者 | string | null | — | — | — | — | — | — | ✅ | ✅ | — | — | — | — |
| 105 | ai_completed_at | AI完了日時 | string | null | — | — | — | — | — | — | — | 🔧 | — | — | — | — |
| 106 | prediction_method | 推定手法 | string | null | — | — | — | — | 🔧 | — | — | 🔧 | — | — | — | — |
| 107 | prediction_score | 推定スコア | number | null | — | — | — | — | 🔧 | — | — | 🔧 | — | — | — | — |
| 108 | model_version | モデル版 | string | null | — | — | — | — | 🔧 | — | — | 🔧 | — | — | — | — |
