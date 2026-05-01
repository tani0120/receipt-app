# 27_一覧UI型（JournalPhase5Mock → JournalListLevel3Mock）

> 仕訳一覧画面（`/journal-list/:clientId`）がデータに要求する全フィールド定義

## 概要

| 項目 | 内容 |
|---|---|
| UI コンポーネント | `JournalListLevel3Mock.vue` |
| composable | `useJournals.ts` |
| 型定義 | `JournalPhase5Mock`（`src/mocks/types/journal_phase5_mock.type.ts`） |
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

- 型定義: [journal_phase5_mock.type.ts](file:///c:/dev/receipt-app/src/mocks/types/journal_phase5_mock.type.ts)
- 行エントリ型: [journal.ts](file:///c:/dev/receipt-app/src/domain/types/journal.ts)
- 変換関数: [lineItemToJournalMock.ts](file:///c:/dev/receipt-app/src/mocks/utils/lineItemToJournalMock.ts)
- UIコンポーネント: [JournalListLevel3Mock.vue](file:///c:/dev/receipt-app/src/mocks/components/JournalListLevel3Mock.vue)
- フィクスチャ: [journal_test_fixture_30cases.ts](file:///c:/dev/receipt-app/src/mocks/data/journal_test_fixture_30cases.ts)
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

- 型定義: [journal_phase5_mock.type.ts](file:///c:/dev/receipt-app/src/mocks/types/journal_phase5_mock.type.ts)
- 行エントリ型: [journal.ts](file:///c:/dev/receipt-app/src/domain/types/journal.ts)
- 暫定変換: [lineItemToJournalMock.ts](file:///c:/dev/receipt-app/src/mocks/utils/lineItemToJournalMock.ts)（Extract API実装後に廃止）
- UIコンポーネント: [JournalListLevel3Mock.vue](file:///c:/dev/receipt-app/src/mocks/components/JournalListLevel3Mock.vue)
- フィクスチャ: [journal_test_fixture_30cases.ts](file:///c:/dev/receipt-app/src/mocks/data/journal_test_fixture_30cases.ts)
- composable: [useJournals.ts](file:///c:/dev/receipt-app/src/mocks/composables/useJournals.ts)

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

- 照合ロジック: [matchLearningRule.ts](file:///c:/dev/receipt-app/src/mocks/utils/pipeline/matchLearningRule.ts)
- 科目確定: [accountDetermination.ts](file:///c:/dev/receipt-app/src/mocks/utils/pipeline/accountDetermination.ts)

---

## 外出しファイル構成（ロジック分離設計）

> JournalListLevel3Mock.vue（5800行）のscript内116関数のうち、ビジネスルールをTS外出し対象とする。

### 現状のファイル構成

| ファイル | 行数 | 内容 | 状態 |
|---|---|---|---|
| `JournalListLevel3Mock.vue` | 5,800行 | template+script+style全部入り | **肥大化** |
| `journalWarningSync.ts` | 385行 | `syncWarningLabelsCore`, `validateDebitCreditCombination`, `validateByVoucherType` | ✅外出し済み |
| `voucherTypeRules.ts` | ~150行 | `VOUCHER_TYPE_RULES`テーブル, `getBaseAccountId` | ✅外出し済み |
| `journalColumns.ts` | ~120行 | 列定義配列, デフォルト幅 | ✅外出し済み |
| `field-nullable-spec.ts` | ~120行 | null表示ルール, `compareWithNull` | ✅外出し済み |

### 問題: Vue側に外出し済みロジックの重複が残存

`syncWarningLabelsCore()`は外出し済みだが、**Vue側に200行の独自実装`syncWarningLabels()`が残存**。外出し版を呼んでいない。

### 外出し計画（段階的実行）

| # | 新規ファイル | 内容 | 削減行数 |
|---|---|---|---|
| 1 | `journalWarningLabels.ts` | warningLabelMap, labelKeyMap, labelTypeLegend（定数） | ~80行 |
| 2 | `accountCategories.ts` | SALES/PURCHASE/BS_CATEGORIES, MEGA_GROUPS, VOUCHER_TYPES（定数） | ~40行 |
| 3 | Vue側統合 | `syncWarningLabels()` → `syncWarningLabelsCore()`呼び出し + UIモーダルのみ | ~200行 |
| 4 | `journalTaxRules.ts` | isTaxCategoryInvalid, resolveDefaultTaxForClient, computeTaxMismatchSummary | ~70行 |
| 5 | `journalHintEngine.ts` | generateHintValidations, generateHintSuggestions（Extract API移行時にサーバー移動） | ~300行 |
| | **合計削減** | | **~690行** |

### Vue側に残すもの（外出し不可）

| カテゴリ | 理由 |
|---|---|
| インライン編集 | DOM操作・ref直結合 |
| フィルハンドル | mouseイベント・DOM操作 |
| セル間D&D | mouseイベント・DOM操作 |
| undo/redo | localJournals ref直結合 |
| モーダル制御 | ref直結合 |
| ソート・フィルタ | computed直結合 |
| ページネーション | computed直結合 |

### ソースファイル参照（外出し済み）

- 警告同期コア: [journalWarningSync.ts](file:///c:/dev/receipt-app/src/mocks/utils/journalWarningSync.ts)
- 証票意味ルール: [voucherTypeRules.ts](file:///c:/dev/receipt-app/src/mocks/utils/voucherTypeRules.ts)
- 列定義: [journalColumns.ts](file:///c:/dev/receipt-app/src/mocks/columns/journalColumns.ts)
- null表示仕様: [field-nullable-spec.ts](file:///c:/dev/receipt-app/src/mocks/definitions/field-nullable-spec.ts)
