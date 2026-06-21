# 27_一覧UI型（JournalPhase5Mock → JournalListLevel3Mock）

> 仕訳一覧画面（`/journal-list/:clientId`）がデータに要求する全フィールド定義

## 概要

| 項目 | 内容 |
|---|---|
| UI コンポーネント | `JournalListLevel3Mock.vue` |
| composable | `useJournals.ts` |
| 型定義 | `JournalPhase5Mock`（`src/types/journal_phase5_mock.type.ts`） |
| 行エントリ型 | `JournalEntryLine`（`src/domain/types/journal.ts`） |
| フィクスチャ | `journal_test_fixture_30cases.ts`（UI開発用サンプルデータ） |

---

## JournalPhase5Mock 全フィールド一覧

### A. 基本情報（必須）

| # | フィールド | 型 | null許容 | UIでの用途 | パイプライン充足 |
|---|---|---|---|---|---|
| 1 | `id` | `string` | ❌ | 行識別・選択・操作対象 | ✅ `jrn-{UUID}` |
| 2 | `client_id` | `string` | ❌ | フィルタ・API呼び出し | ✅ |
| 3 | `display_order` | `number` | ❌ | ソート順 | ✅ `index + 1` |
| 4 | `voucher_date` | `string \| null` | ✅ | 日付列・ソート・フィルタ | ✅ LineItem.date |
| 5 | `date_on_document` | `boolean` | ❌ | DATE_UNKNOWN警告判定 | ✅ |
| 6 | `description` | `string` | ❌ | 摘要列 | ✅ LineItem.description |

### B. 証票分類（パイプライン3フィールド）

| # | フィールド | 型 | null許容 | UIでの用途 | パイプライン充足 |
|---|---|---|---|---|---|
| 7 | `voucher_type` | `string \| null` | ✅ | 証票意味列（経費/クレカ等）表示 | ✅ resolveVoucherType() |
| 8 | `source_type` | `SourceType \| null` | ✅ | 証票種別フィルタ・ソート | ⚠️ 暫定: previewExtract結果（Extract API実装後はExtractが供給） |
| 9 | `direction` | `Direction \| null` | ✅ | debit/credit配置決定 | ⚠️ 暫定: previewExtract結果（Extract API実装後はExtractが供給） |
| 10 | `vendor_vector` | `VendorVector \| null` | ✅ | 業種表示（未使用列） | ⚠️ previewExtract未出力の場合あり |

### C. 取引先特定（Step4-C）

| # | フィールド | 型 | null許容 | UIでの用途 | パイプライン充足 |
|---|---|---|---|---|---|
| 11 | `vendor_id` | `string \| null` | ✅ | 学習ルール紐付け | ⚠️ 辞書ヒット時のみ |
| 12 | `vendor_name` | `string \| null` | ✅ | （将来）取引先名表示列 | ⚠️ → ✅ 修正済み（v.item.vendor_name フォールバック追加） |

### D. 証票紐付け

| # | フィールド | 型 | null許容 | UIでの用途 | パイプライン充足 |
|---|---|---|---|---|---|
| 13 | `document_id` | `string \| null` | ✅ | 写真アイコン表示・プレビュー | ✅ DocEntry.id |
| 14 | `line_id` | `string \| null` | ✅ | 証票行逆引き | ✅ `{docId}_line-{index}` |

### E. 仕訳明細（N対N複合仕訳）

| # | フィールド | 型 | null許容 | UIでの用途 | パイプライン充足 |
|---|---|---|---|---|---|
| 15 | `debit_entries` | `JournalEntryLine[]` | ❌（空配列可） | 借方科目・補助・税区分・金額 | ⚠️ → ✅ 修正済み（プレースホルダー生成） |
| 16 | `credit_entries` | `JournalEntryLine[]` | ❌（空配列可） | 貸方科目・補助・税区分・金額 | ⚠️ → ✅ 修正済み（プレースホルダー生成） |

### F. ステータス・フラグ

| # | フィールド | 型 | null許容 | UIでの用途 | パイプライン充足 |
|---|---|---|---|---|---|
| 17 | `status` | `'exported' \| null` | ✅ | 出力済/未出力フィルタ | ✅ `null`（未出力） |
| 18 | `is_read` | `boolean` | ❌ | 未読背景色（薄黄色） | ✅ `false` |
| 19 | `read_by` | `string \| null` | ✅ | 既読操作者 | ✅ 未設定 |
| 20 | `read_at` | `string \| null` | ✅ | 既読日時 | ✅ 未設定 |
| 21 | `deleted_at` | `string \| null` | ✅ | ゴミ箱フィルタ | ✅ `null` |
| 22 | `deleted_by` | `string \| null` | ✅ | 削除者 | ✅ 未設定 |

### G. ラベル・警告

| # | フィールド | 型 | null許容 | UIでの用途 | パイプライン充足 |
|---|---|---|---|---|---|
| 23 | `labels` | `JournalLabelMock[]` | ❌（空配列可） | 警告アイコン・フィルタ・ソート | ✅ `['ACCOUNT_UNKNOWN']` or `[]` |
| 24 | `warning_dismissals` | `string[]` | ❌（空配列可） | 警告確認済み記録 | ✅ `[]` |
| 25 | `warning_details` | `Record<string, string>` | ❌（空オブジェクト可） | 警告ホバーツールチップ | ✅ `{}` |

### H. 出力・クレカ

| # | フィールド | 型 | null許容 | UIでの用途 | パイプライン充足 |
|---|---|---|---|---|---|
| 26 | `export_batch_id` | `string \| null` | ✅ | 出力バッチ逆引き | ✅ `null` |
| 27 | `is_credit_card_payment` | `boolean` | ❌ | クレカ払い列アイコン | ✅ 引数から設定 |

### I. ルール・インボイス

| # | フィールド | 型 | null許容 | UIでの用途 | パイプライン充足 |
|---|---|---|---|---|---|
| 28 | `rule_id` | `string \| null` | ✅ | ルール適用アイコン | ⚠️ 辞書ヒット時のみ |
| 29 | `invoice_status` | `'qualified' \| 'not_qualified' \| null` | ✅ | インボイスアイコン | ✅ `null` |
| 30 | `invoice_number` | `string \| null` | ✅ | インボイス番号表示 | ✅ `null` |

### J. メモ

| # | フィールド | 型 | null許容 | UIでの用途 | パイプライン充足 |
|---|---|---|---|---|---|
| 31 | `memo` | `string \| null` | ✅ | メモアイコン・内容表示 | ✅ `null` |
| 32 | `memo_author` | `string \| null` | ✅ | メモ作成者 | ✅ `null` |
| 33 | `memo_target` | `string \| null` | ✅ | メモ宛先 | ✅ `null` |
| 34 | `memo_created_at` | `string \| null` | ✅ | メモ日時 | ✅ `null` |

### K. スタッフノート

| # | フィールド | 型 | null許容 | UIでの用途 | パイプライン充足 |
|---|---|---|---|---|---|
| 35 | `staff_notes` | `StaffNotes \| null` | ✅ | 要対応列（4カテゴリ） | ✅ 未設定（optional） |
| 36 | `staff_notes_author` | `string \| null` | ✅ | 担当者名 | ✅ 未設定（optional） |

### L. 出力・監査

| # | フィールド | 型 | null許容 | UIでの用途 | パイプライン充足 |
|---|---|---|---|---|---|
| 37 | `exported_at` | `string \| null` | ✅ | 出力日時 | ✅ 未設定（optional） |
| 38 | `exported_by` | `string \| null` | ✅ | 出力者 | ✅ 未設定（optional） |
| 39 | `created_at` | `string \| null` | ✅ | 作成日時 | ✅ `new Date().toISOString()` |
| 40 | `updated_at` | `string \| null` | ✅ | 更新日時 | ✅ 未設定（optional） |
| 41 | `created_by` | `string \| null` | ✅ | 作成者 | ✅ `'AI'` |
| 42 | `updated_by` | `string \| null` | ✅ | 更新者 | ✅ 未設定（optional） |

### M. AI推定

| # | フィールド | 型 | null許容 | UIでの用途 | パイプライン充足 |
|---|---|---|---|---|---|
| 43 | `ai_completed_at` | `string \| null` | ✅ | AI完了日時 | ✅ 未設定（optional） |
| 44 | `prediction_method` | `string \| null` | ✅ | 推定方法表示 | ⚠️ acctResult時のみ |
| 45 | `prediction_score` | `number \| null` | ✅ | 信頼度表示 | ✅ 未設定（optional） |
| 46 | `model_version` | `string \| null` | ✅ | モデルバージョン | ✅ 未設定（optional） |

---

## JournalEntryLine 全フィールド一覧（借方/貸方 各行）

| # | フィールド | 型 | null許容 | UIでの用途 | パイプライン充足 |
|---|---|---|---|---|---|
| 1 | `id` | `string \| null` | ✅ | 行PK | ✅ `jre-{UUID}` |
| 2 | `account` | `string \| null` | ✅ | 勘定科目列（マスタからname解決） | ⚠️ insufficient時はnull |
| 3 | `account_on_document` | `boolean` | ❌ | ACCOUNT_UNKNOWN警告判定 | ✅ |
| 4 | `sub_account` | `string \| null` | ✅ | 補助科目列 | ⚠️ 学習ルール時のみ |
| 5 | `department` | `string \| null` | ✅ | 部門列 | ⚠️ 学習ルール時のみ |
| 6 | `amount` | `Yen \| null` | ✅ | 金額列 | ✅ LineItem.amount |
| 7 | `amount_on_document` | `boolean` | ❌ | AMOUNT_UNCLEAR警告判定 | ✅ |
| 8 | `tax_category_id` | `string \| null` | ✅ | 税区分列（マスタからname解決） | ⚠️ insufficient時はnull |

---

## パイプライン充足率サマリ

| カテゴリ | 全件充足 | 条件付き充足 | 未充足 |
|---|---|---|---|
| A. 基本情報 | 6/6 | 0 | 0 |
| B. 証票分類 | 3/4 | 1 | 0 |
| C. 取引先 | 0/2 | 2 | 0 |
| D. 証票紐付 | 2/2 | 0 | 0 |
| E. 仕訳明細 | 2/2 | 0 | 0 |
| F. ステータス | 6/6 | 0 | 0 |
| G. ラベル | 3/3 | 0 | 0 |
| H. 出力 | 2/2 | 0 | 0 |
| I. ルール | 1/3 | 1 | 0 |
| J. メモ | 4/4 | 0 | 0 |
| K. スタッフ | 2/2 | 0 | 0 |
| L. 監査 | 4/6 | 0 | 0 |
| M. AI推定 | 3/4 | 1 | 0 |
| **合計** | **38/46** | **5** | **0** |

> **条件付き（⚠️）の5フィールド**: vendor_vector, vendor_id, rule_id, prediction_method は辞書接続・学習ルールヒット時のみ設定。vendor_name は修正済み（フォールバック追加）。

---

## UIが空配列/null時に壊れる箇所（既知）

| フィールド | 壊れ方 | 修正状態 |
|---|---|---|
| `debit_entries: []` | テーブル行が0行→非表示 | ✅ 修正済み（プレースホルダー生成） |
| `credit_entries: []` | 同上 | ✅ 修正済み |
| `account: null` | 科目列に「--」表示（赤背景） | ✅ 正常動作（手入力可） |
| `amount: null` | 金額列が空欄 | ✅ プレースホルダーでitem.amount転写 |
| `labels: []` | 警告アイコンなし | ✅ 正常動作 |

---

## ソースファイル参照

- 型定義: src/types/journal_phase5_mock.type.ts
- 行エントリ型: src/types/journal_phase5_mock.type.ts（JournalEntryLine）
- 変換関数: src/utils/pipeline/lineItemToJournalMock.ts
- UIコンポーネント: src/components/JournalListLevel3Mock.vue
- フィクスチャ: src/data/mock/journal_test_fixture_30cases.ts
---

## 仕訳データの供給元

### 本来の設計: Extract API（未実装）

仕訳一覧UIが期待するJournalPhase5Mock型の全フィールドは、**Extract API（本番AI）が出力する。** previewExtract APIはUIプレビュー用の軽量AIであり、仕訳の型は一切出力しない。

```
previewExtract API → source_type, direction, line_items（粗い）→ UIプレビュー表示用のみ
Extract API  → JournalPhase5Mock型の完全な仕訳データ   → 仕訳一覧UI表示 → CSV出力
```

| 項目 | previewExtract API | Extract API（未実装） |
|---|---|---|
| 発火タイミング | アップロード時（即時） | **選別確定時**（確定送信ボタン押下） |
| 入力 | 画像1枚 | 独自+Drive全証票をバッチ投入 |
| 出力型 | PreviewExtractRawResponse | **JournalPhase5Mock** |
| previewExtractの出力 | — | 選別確定後に**完全削除**。本番AIへの入力にも渡さない |

> 詳細: [24_upload_drive_integration.md §17](file:///c:/dev/receipt-app/docs/genzai/24_upload_drive_integration.md) 参照

### 暫定処理（Extract API未実装時）

Extract APIが未実装のため、現在は以下の暫定フローで動作:

```
暫定: previewExtract出力 → lineItemToJournalMock()で無理やり仕訳形式に変換
本来: Extract API → JournalPhase5Mock型の完全な仕訳を直接出力
```

`lineItemToJournalMock()` はExtract API実装後に**不要になる暫定処理**。

### ソースファイル参照

- 型定義: src/types/journal_phase5_mock.type.ts
- 行エントリ型: src/types/journal_phase5_mock.type.ts（JournalEntryLine）
- 暫定変換: src/utils/pipeline/lineItemToJournalMock.ts（Extract API実装後に廃止）
- UIコンポーネント: src/components/JournalListLevel3Mock.vue
- フィクスチャ: src/data/mock/journal_test_fixture_30cases.ts
- composable: src/composables/useJournals.ts

---

## フィールド責務マトリクス（Extract API設計用）

> 各フィールドの値を「誰が」設定するかの分類。Extract API実装時に、AIに出力させるべきフィールドを明確にする。

### 責務区分

| 区分 | 説明 | 例 |
|---|---|---|
| **AI出力** | Extract APIが画像/証票から直接抽出 | `voucher_date`, `description`, `amount` |
| **AI選択** | AIがenum値から選択（自由記述禁止） | `source_type`, `direction`, `voucher_type` |
| **AI推定** | AIが信頼度付きで推定 | `account`, `tax_category_id` |
| **TS計算** | フロントTSが自動計算（AIは関与しない） | `id`, `display_order`, `labels` |
| **TS前処理** | フロントTSが正規化・マッチング処理 | `vendor_id`, `rule_id`, `match_key` |
| **ユーザー入力** | ユーザーが手動で入力/編集 | `memo`, `staff_notes` |
| **システム自動** | システムが自動設定（タイムスタンプ等） | `created_at`, `updated_at` |

### 全46フィールド × 責務

| # | フィールド | 責務 | 備考 |
|---|---|---|---|
| 1 | `id` | TS計算 | `jrn-{UUID}`生成 |
| 2 | `client_id` | TS計算 | ルートパラメータから |
| 3 | `display_order` | TS計算 | index + 1 |
| 4 | `voucher_date` | **AI出力** | YYYY-MM-DD形式で抽出。nullの場合DATE_UNKNOWN |
| 5 | `date_on_document` | **AI出力** | 証票上に日付の記載があるか（true/false） |
| 6 | `description` | **AI出力** | 摘要。取引内容を抽出 |
| 7 | `voucher_type` | **AI選択** | 証票意味。enum値から選択（後述） |
| 8 | `source_type` | **AI選択** | 証票種別。enum値から選択（後述） |
| 9 | `direction` | **AI選択** | 仕訳方向。enum値から選択（後述） |
| 10 | `vendor_vector` | AI出力 or TS計算 | 業種ベクトル。※未確定 |
| 11 | `vendor_id` | **TS前処理** | 正規化した照合キーで辞書マッチング |
| 12 | `vendor_name` | **AI出力** | 発行者/取引先名を抽出 |
| 13 | `document_id` | TS計算 | DocEntry.idを転写 |
| 14 | `line_id` | TS計算 | `{docId}_line-{index}`生成 |
| 15 | `debit_entries` | **AI推定** | 借方エントリ。科目・金額・税区分をAIが推定 |
| 16 | `credit_entries` | **AI推定** | 貸方エントリ。同上 |
| 17 | `status` | TS計算 | 初期値null（未出力） |
| 18 | `is_read` | TS計算 | 初期値false |
| 19 | `read_by` | ユーザー入力 | 既読操作時に記録 |
| 20 | `read_at` | システム自動 | 既読操作時のタイムスタンプ |
| 21 | `deleted_at` | ユーザー入力 | ゴミ箱操作時 |
| 22 | `deleted_by` | ユーザー入力 | ゴミ箱操作時 |
| 23 | `labels` | **TS計算** | `syncWarningLabelsCore()`が自動生成 |
| 24 | `warning_dismissals` | ユーザー入力 | 警告確認済み記録 |
| 25 | `warning_details` | TS計算 | `syncWarningLabelsCore()`が詳細メッセージ生成 |
| 26 | `export_batch_id` | TS計算 | CSV出力時に設定 |
| 27 | `is_credit_card_payment` | **AI選択** or TS計算 | source_type=credit_cardの場合true |
| 28 | `rule_id` | **TS前処理** | 学習ルールマッチング結果 |
| 29 | `invoice_status` | **AI出力** | インボイス適格判定 |
| 30 | `invoice_number` | **AI出力** | インボイス番号抽出 |
| 31 | `memo` | ユーザー入力 | |
| 32 | `memo_author` | ユーザー入力 | |
| 33 | `memo_target` | ユーザー入力 | |
| 34 | `memo_created_at` | システム自動 | |
| 35 | `staff_notes` | ユーザー入力 | |
| 36 | `staff_notes_author` | ユーザー入力 | |
| 37 | `exported_at` | システム自動 | |
| 38 | `exported_by` | ユーザー入力 | |
| 39 | `created_at` | システム自動 | |
| 40 | `updated_at` | システム自動 | |
| 41 | `created_by` | TS計算 | `'AI'` |
| 42 | `updated_by` | ユーザー入力 | 編集時に記録 |
| 43 | `ai_completed_at` | システム自動 | Extract API完了時刻 |
| 44 | `prediction_method` | **AI出力** | 推定手法名 |
| 45 | `prediction_score` | **AI出力** | 信頼度スコア |
| 46 | `model_version` | **AI出力** | 使用モデルバージョン |

### JournalEntryLine × 責務

| # | フィールド | 責務 | 備考 |
|---|---|---|---|
| 1 | `id` | TS計算 | `jre-{UUID}` |
| 2 | `account` | **AI推定** | 勘定科目ID。マスタに存在するIDで出力必須。不明時null |
| 3 | `account_on_document` | **AI出力** | 証票上に科目記載があるか |
| 4 | `sub_account` | **TS前処理** | 学習ルールまたはマスタのデフォルト補助科目 |
| 5 | `department` | **TS前処理** | 学習ルールから |
| 6 | `amount` | **AI出力** | 金額。正整数 |
| 7 | `amount_on_document` | **AI出力** | 証票上に金額記載があるか |
| 8 | `tax_category_id` | **AI推定** or TS計算 | 科目のdefaultTaxCategoryIdから自動設定。AIが推定する場合もあり |

---

## 警告ラベル責務分担（15種）

> 各警告ラベルについて「AIが検出すべきか」「フロントTSバリデーションが検出すべきか」を明確化。

| # | ラベル | レベル | 責務 | 検出タイミング | ロジック所在 |
|---|---|---|---|---|---|
| 1 | `DEBIT_CREDIT_MISMATCH` | error | **TS** | セル編集確定時 | `syncWarningLabelsCore()` L306-310 |
| 2 | `DESCRIPTION_UNKNOWN` | warn | **TS** | セル編集確定時 | `syncWarningLabelsCore()` L289-291 |
| 3 | `DATE_UNKNOWN` | error | **TS** | セル編集確定時 | `syncWarningLabelsCore()` L293-295 |
| 4 | `ACCOUNT_UNKNOWN` | error | **TS** | セル編集確定時 | `syncWarningLabelsCore()` L259-268 |
| 5 | `TAX_UNKNOWN` | error | **TS** | セル編集確定時 | `syncWarningLabelsCore()` L270-287 |
| 6 | `AMOUNT_UNCLEAR` | error | **TS** | セル編集確定時 | `syncWarningLabelsCore()` L297-304 |
| 7 | `CATEGORY_CONFLICT` | warn | **TS** | 科目選択時 | `syncWarningLabelsCore()` L312-331 |
| 7b | `SAME_ACCOUNT_BOTH_SIDES` | warn | **TS** | 科目選択時 | `syncWarningLabelsCore()` L333-338 |
| 8 | `VOUCHER_TYPE_CONFLICT` | warn | **TS** | 科目選択時 | `syncWarningLabelsCore()` L340-349 |
| 9 | `TAX_ACCOUNT_MISMATCH` | warn | **TS** | 科目選択時 | `syncWarningLabelsCore()` L351-381 |
| 10 | `FUTURE_DATE` | error | **TS**（Vue側のみ） | セル編集確定時 | Vue側 `syncWarningLabels()` L3072-3082 |
| 11 | `DUPLICATE_CONFIRMED` | error | **AI** | Extract API処理時 | SHA-256ハッシュ比較 |
| 12 | `DUPLICATE_SUSPECT` | warn | **AI** | Extract API処理時 | 日付+金額+取引先の一致 |
| 13 | `MULTIPLE_VOUCHERS` | error | **AI** | previewExtract時 | 画像内複数証票検出 |
| 14 | `UNREADABLE_ESTIMATED` | warn | **AI** | Extract API処理時 | 信頼度低い推定値 |
| 15 | `MEMO_DETECTED` | warn | **AI** | previewExtract時 | 手書きメモ検出 |

### 重要な設計ポイント

- **TS責務のラベル（1-9）**: `syncWarningLabelsCore()`（journalWarningSync.ts）が一括判定。セル編集・科目選択のたびに再実行される
- **AI責務のラベル（11-15）**: Extract APIが画像分析時に設定。TSは変更しない
- **FUTURE_DATE（10）**: 現在Vue側にのみ実装。`syncWarningLabelsCore()`に統合すべき（※外出し時の課題）
- **TS側で重複実装が残存**: Vue側の`syncWarningLabels()`（200行）と外出し済みの`syncWarningLabelsCore()`が並存。統合が最優先

---

## AIに選択させるenum定義

> AIは自由記述せず、以下のenum値から選択する。

### source_type（証票種別）12種

```
receipt | invoice | bank_statement | credit_card | transport_ic |
medical | insurance | tax_notice | salary_slip | delivery_slip |
non_journal | other
```

### direction（仕訳方向）4種

```
expense | income | transfer | mixed
```

### voucher_type（証票意味）8種

> UIの証票意味ドロップダウンと一致させる

```
売上 | 経費 | 給与 | 立替経費 | 振替 | クレカ | クレカ引落 | その他
```

### invoice_status（インボイス適格）2種 + null

```
qualified | not_qualified | null（判定不能時）
```

---

## 写真表示のデータフロー

> `document_id` → 写真アイコン表示 → プレビューモーダル

```
DocEntry（documents-{clientId}.json）
  ├── id: "doc-xxx"
  ├── storagePath: "uploads/xxx.webp"（実ファイルパス）
  └── thumbnailPath: "uploads/thumb_xxx.webp"

JournalPhase5Mock
  └── document_id: "doc-xxx"  ← DocEntry.idを転写

UI表示時:
  document_id → getDocumentImageUrl(documentId) → /data/storage/{storagePath}
  → 画像モーダルに表示（回転・ズーム・パン操作可能）
```

### Extract API時の入力データ

```
Extract APIへの入力:
  ① 画像ファイル（Drive URLまたはBase64）
  ② DocEntryメタデータ（id, storagePath）※previewExtractの出力は渡さない（完全削除済み）
  ③ 顧問先マスタ（勘定科目リスト、税区分リスト、学習ルール）

Extract APIの出力:
  JournalPhase5Mock[] ← 1証票から1件以上の仕訳を生成
  └── document_id = DocEntry.id（入力データから転写）
```

---

## 照合キーと前処理

### 正規化した照合キー（match_key）

> vendor_idの特定に使用。AIが抽出したvendor_nameを正規化し、辞書と照合する。

```
AI出力: vendor_name = "（株）田中商事"
    ↓ 正規化（TS前処理）
match_key = "田中商事"  ← 法人格除去、全角→半角、スペース除去
    ↓ 辞書照合
vendor_id = "V-001"  ← 一致する取引先ID
rule_id = "rule-xxx"  ← 取引先に紐付く学習ルール
```

### 前処理タイミング

```
Extract API出力受信
    ↓
① TS前処理: vendor_name → match_key正規化
② TS前処理: match_key → vendor辞書照合 → vendor_id設定
③ TS前処理: vendor_id → 学習ルール照合 → rule_id設定
④ TS前処理: rule_id → ルールに基づく科目/補助科目/税区分の上書き
⑤ TS計算: syncWarningLabelsCore() → labels/warning_details生成
⑥ 保存: journals-{clientId}.json
```

### ソースファイル参照

- 照合ロジック: src/utils/pipeline/matchLearningRule.ts
- 科目確定: src/utils/pipeline/accountDetermination.ts

---

## JournalListLevel3Mock.vue 構造分析

> **元セッション**: d3cec2e6 component_analysis.md より転記（2026-06-21）

### 基本数値

| セクション | 行範囲 | 行数 | 比率 |
|---|---|---|---|
| テンプレート | L1-L2201 | **2201行** | 41% |
| スクリプト | L2203-L5315 | **3113行** | 58% |
| スタイル | L5317-L5375 | **59行** | 1% |
| **合計（初期値）** | | **6180行** | |
| **合計（②〜⑤分離後）** | | **5373行** | **-807行（-13.1%）** |
| **合計（⑥-1 + divタグ修正後）** | | **5375行** | **+2行（import追加+divタグ修正）** |
| **合計（⑥-3分離後）** | | **~4890行** | **-485行（テンプレ300行+スクリプト185行）** |
| **合計（Phase C composable抽出後）** | | **~4167行** | **-767行（C-1〜C-3合計）** |

### テンプレート構造（2201行）

| ブロック | 行範囲 | 行数 | 内容 |
|---|---|---|---|
| ツールバー | L1-L169 | 169 | 検索、フィルタチェックボックス、一括操作バー |
| 初回選択ヘルプ | L170-L178 | 9 | fadeOutヘルプ |
| テーブルヘッダー | L179-L425 | 247 | 列ヘッダー、列リサイズ |
| **テーブルボディ** | L426-L1681 | **1256** | **仕訳行描画（全列テンプレート）** |
| フッター | L1682-L1727 | 46 | ページネーション |
| 過去仕訳検索モーダル | L1728-L2050 | 323 | 取込仕訳検索（⑥-3で分離済み） |
| 税区分矛盾モーダル | L2075-L2169 | 95 | 税区分矛盾フローティング |
| ツールチップ+ドラッグ | L2170-L2201 | 32 | グローバルUI部品 |

> [!WARNING]
> テーブルボディ（L426-L1681, **1256行**）が最大のブロック。
> 1つの`v-for`ループ内に全列の描画ロジックが詰まっている。
> 列ごとのif/else-ifチェーンが**20段以上**ネストしている。

> [!IMPORTANT]
> **divタグ不整合修正（2026-06-20 ⑥-1実施中に発見・修正）**:
> 6c79c24（②〜⑤モーダル分離コミット）でルートdivの`</div>`が欠落していた。
> L177の余分な`</div>`を削除し、テンプレート末尾（L2200）にルートdivの閉じタグを追加。
> これにより`vite build`の`Element is missing end tag`エラーが解消。

### スクリプト機能ブロック（3113行）

| # | 機能 | 行範囲（概算） | 行数 | 状態変数数 | 関数数 |
|---|---|---|---|---|---|
| 1 | import/初期化 | L2203-L2280 | 78 | 3 | 2 |
| 2 | 顧問先連動 | L2281-L2330 | 50 | 2 | 0 |
| 3 | 区分ドロップダウン | L2331-L2384 | 54 | 4 | 2 |
| 4 | 税区分矛盾 | L2385-L2534 | 150 | 3 | 2 |
| 5 | コンボボックス検索 | L2535-L2906 | 372 | 6 | 8 |
| 6 | コンボボックス選択 | L2907-L2976 | 70 | 0 | 3 |
| 7 | コンボボックスblur | L2977-L3009 | 33 | 0 | 1 |
| 8 | 補助科目ドロップダウン | L3010-L3061 | 52 | 2 | 1 |
| 9 | インライン編集 | L3062-L3285 | 224 | 4 | 7 |
| 10 | フィルハンドル | L3286-L3465 | 180 | 4 | 5 |
| 11 | セル間ドラッグ | L3466-L3645 | 180 | 6 | 8 |
| 12 | フィルタ/選択状態 | L3646-L3698 | 53 | 7 | 0 |
| 13 | ツールチップ | L3700-L3797 | 98 | 6 | 5 |
| 14 | ヒントモーダル（親側残留） | L3798-L3900 | 103 | 2 | 3 |
| 15 | ワークフロー操作 | L3901-L4063 | 163 | 0 | 6 |
| 16 | 一括操作 | L4064-L4315 | 252 | 1 | 7 |
| 17 | 過去仕訳検索 | L4316-L4622 | 307 | 10 | 8 |
| 18 | ページネーション | L4623-L4643 | 21 | 6 | 1 |
| 19 | 編集ガード | L4670-L4700 | 31 | 0 | 3 |
| 20 | normalizeJournalForUI | L4750-L4795 | 46 | 0 | 1 |
| 21 | API通信/PATCH | L4796-L4880 | 85 | 3 | 4 |
| 22 | journals依存computed | L4881-L4920 | 40 | 5 | 2 |
| 23 | ユーティリティ | L4921-L5100 | 180 | 0 | 8 |
| 24 | キーボード/計測 | L5280-L5315 | 36 | 1 | 1 |

**合計: 状態変数 ~85個、関数 ~88個**（②〜⑤分離で-22変数, -27関数）

> [!NOTE]
> Phase C composable抽出後、#9（インライン編集）はuseInlineEdit.tsに、
> #10-11（フィルハンドル/セル間ドラッグ）はuseCellDragAndFill.tsに、
> #5-8（コンボボックス関連）はuseAccountCombobox.tsに移動済み。

### 相互依存マップ

**核心: `journals` ref**

ほぼ全ての機能が`journals` (shallowRef) に依存している。

```
journals.value ← fetchJournalList() が設定
    ↓
    ├── paginatedJournals（computed → テンプレートのv-for）
    ├── visibleIds（computed → 選択管理） ← isImportedJournal()で取込仕訳を除外
    ├── selectedJournals（computed → 一括操作）
    ├── taxMismatchSummary（computed → 税区分矛盾）← isImportedJournal()で取込仕訳を除外
    ├── filteredPastJournals（computed → 取込仕訳検索モーダル）
    ├── syncWarningLabels()（onMounted → 警告ラベル一括同期）
    └── updateJournalField()（楽観的UI更新 + PATCHキュー）← isImportedJournal()でガード
```

### 分割戦略ロードマップ

> 原則: 「付属器官を外してから心臓を触る」

| 順序 | タスク | 効果 | リスク | 状態 |
|---|---|---|---|---|
| ① 編集禁止境界の確立 | updateJournalFieldを唯一の更新口にする | 取込仕訳ガード完全化 | — | ✅ 完了 |
| ② ImageModal分離 | ImageModal.vue | -164行 | — | ✅ 完了 |
| ③ EvidenceSearchModal分離 | EvidenceSearchModal.vue | -255行 | — | ✅ 完了 |
| ④ CommentModal分離 | CommentModal.vue | -145行 | — | ✅ 完了 |
| ⑤ HintModal分離 | HintModal.vue | -243行 | — | ✅ 完了 |
| ⑥-1 `_isPastJournal`廃止→source判定移行 | 43箇所置換、as any削除 | 型安全化 | — | ✅ 完了（§25に詳細） |
| ⑥-2 `showPastCsv`→`showImported`リネーム | 11箇所（4ファイル） | 命名統一 | — | ✅ 完了（§25に詳細） |
| ⑥-3 PastJournalSearchModal分離 | PastJournalSearchModal.vue | -485行 | — | ✅ 完了（§25に詳細） |
| ⑦ autoSave廃止 | Phase Cで完了 | — | — | ✅ 完了 |
| ⑧ journals更新経路一本化 | 直接変更全廃 | — | — | ✅ ①で同時完了 |
| Phase C-1 useInlineEdit抽出 | インライン編集+Undo/Redo | -230行 | — | ✅ 完了 |
| Phase C-2 useCellDragAndFill抽出 | フィルハンドル+セル間D&D | -341行 | — | ✅ 完了 |
| Phase C-3 useAccountCombobox抽出 | 科目/税区分/補助科目コンボ | -237行 | — | ✅ 完了 |
| ⑨ テーブル本体分割 | 最後 | **高** | ⑥完了後 | 未着手（保留） |

> [!CAUTION]
> ⑨テーブル本体分割はcomposable抽出で代替済み。テンプレート分割はprops/emit爆発のため保留。

### ②〜⑤ モーダル分離 ✅ 完了（2026-06-20 コミット 6c79c24）

**実績行数**:

```
初期:          6180行
② ImageModal:  -164行 → 6016行  ✅ 完了
③ Evidence:    -255行 → 5761行  ✅ 完了
⑤ Hint:        -243行 → 5518行  ✅ 完了
④ Comment:     -145行 → 5373行  ✅ 完了
                         --------
                         5373行（-807行、-13.1%）
```

**共有関数の扱い**:

| 関数 | 使用箇所 | 方針 |
|---|---|---|
| `modalDrag` | 全6モーダル | `utils/modalDrag.ts`に抽出済み |
| `useDraggable` | 全6モーダル | 既にcomposable化済み。各子で個別呼出 |

> [!WARNING]
> **6c79c24でdivタグ不整合が混入**（open=143, close=142）。
> ⑥-1実施中に発見・修正済み（L177の余分な`</div>`削除 + テンプレート末尾にルートdiv閉じタグ追加）。

---

## 外出しファイル構成（ロジック分離設計）



> JournalListLevel3Mock.vue は当初6180行だったが、モーダル分離（②〜⑤, ⑥-3）と
> composable抽出（Phase C-1〜C-3）により **4167行（-32.6%）** に削減済み。

### 現状のファイル構成（2026-06-21時点）

| ファイル | 行数 | 内容 | 状態 |
|---|---|---|---|
| JournalListLevel3Mock.vue | 4,167行 | template+script+style | composable抽出済み |
| useInlineEdit.ts | 343行 | セルインライン編集 + Undo/Redo | ✅ Phase C-1で抽出 |
| useCellDragAndFill.ts | ~350行 | フィルハンドル + セル間D&D + イベント登録 | ✅ Phase C-2で抽出 |
| useAccountCombobox.ts | ~322行 | 科目/税区分/補助科目コンボボックス | ✅ Phase C-3で抽出 |
| ImageModal.vue | ~170行 | 証票画像モーダル | ✅ ②で分離 |
| EvidenceSearchModal.vue | ~260行 | 証憑検索モーダル | ✅ ③で分離 |
| CommentModal.vue | ~150行 | コメントモーダル | ✅ ④で分離 |
| HintModal.vue | ~250行 | ヒントモーダル | ✅ ⑤で分離 |
| PastJournalSearchModal.vue | ~570行 | 過去仕訳検索モーダル | ✅ ⑥-3で分離 |
| journalWarningSync.ts | 385行 | syncWarningLabelsCore, validateDebitCreditCombination, validateByVoucherType | ✅外出し済み |
| voucherTypeRules.ts | ~150行 | VOUCHER_TYPE_RULESテーブル, getBaseAccountId | ✅外出し済み |
| journalColumns.ts | ~120行 | 列定義配列, デフォルト幅 | ✅外出し済み |
| field-nullable-spec.ts | ~120行 | null表示ルール, compareWithNull | ✅外出し済み |

### 分離実績サマリ

| フェーズ | 内容 | 削減行数 |
|---|---|---|
| ②〜⑤ モーダル分離 | ImageModal/EvidenceSearch/Comment/Hint | -807行 |
| ⑥-1 _isPastJournal廃止 | source判定（isImportedJournal）へ統一 | 行数変動なし（型安全化） |
| ⑥-2 showPastCsv→showImportedリネーム | 11箇所/4ファイル | 行数変動なし |
| ⑥-3 PastJournalSearchModal分離 | 過去仕訳検索モーダル | -485行 |
| Phase C-1 useInlineEdit | インライン編集 + Undo/Redo | -230行 |
| Phase C-2 useCellDragAndFill | フィルハンドル + セル間D&D | -341行 |
| Phase C-3 useAccountCombobox | 科目/税区分/補助科目コンボ | -237行 |
| **合計** | | **-2013行（-32.6%）** |

### Vue側に残っている機能

| カテゴリ | 理由 |
|---|---|
| バリデーション表示（syncWarningLabels） | UIモーダル表示（confirmDialog）に直結 |
| フィルタ/選択状態 | journals shallowRefに直結 |
| ツールチップ | DOMイベント直結 |
| ワークフロー操作 | journals直接変更 + API呼出 |
| 一括操作 | selectedJournals + journals直接変更 |
| ページネーション | computed直結 |
| キーボードショートカット | onMounted/onUnmounted直結 |

### ⑨ テーブル本体分割（未着手・保留）

テーブルボディ（L426-L1681, 1256行）の単一v-forループ内には:

- インライン編集（dblclick → input/select → commitCellEdit）
- ドラッグ&ドロップ（mousedown → mousemove → mouseup）
- フィルハンドル（mousedown → 範囲選択 → 値コピー）
- コンボボックス検索（input → filter → optgroup → blur）
- Undo/Redo（snapshot → restore）
- バリデーション（syncWarningLabels → セルハイライト）

これらが**同一のjournalオブジェクト**に対して相互作用する。

`<AccountCell />`等に分割すると:
- props: journal, rowIndex, colKey, isEditing, editingValue, isDragOver, ...（10個以上）
- emit: startEdit, commitEdit, startDrag, endDrag, ...（8個以上）

**6180行 → 40ファイルになるだけで複雑性は減らない。**

①〜⑧を完了して更新経路が一本化された後なら、テーブル行コンポーネント化は検討可能。
ただしcomposable抽出（Phase C-1〜C-3）で-767行削減済みのため、テンプレート分割はSupabase移行後に再検討。

### ソースファイル参照

- composable: src/composables/useInlineEdit.ts
- composable: src/composables/useCellDragAndFill.ts
- composable: src/composables/useAccountCombobox.ts
- 警告同期コア: src/shared/validation/journalValidationCore.ts
- 証票意味ルール: src/shared/validation/voucherTypeRules.ts
- 列定義: src/constants/journalColumns.ts
- null表示仕様: src/shared/field-nullable-spec.ts

