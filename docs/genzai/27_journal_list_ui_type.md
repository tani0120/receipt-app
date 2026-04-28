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
| 8 | `source_type` | `SourceType \| null` | ✅ | 証票種別フィルタ・ソート | ✅ classify結果 |
| 9 | `direction` | `Direction \| null` | ✅ | debit/credit配置決定 | ✅ classify結果 |
| 10 | `vendor_vector` | `VendorVector \| null` | ✅ | 業種表示（未使用列） | ⚠️ classify未出力の場合あり |

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

仕訳一覧UIが期待するJournalPhase5Mock型の全フィールドは、**Extract API（本番AI）が出力する。** classify APIはUIプレビュー用の軽量AIであり、仕訳の型は一切出力しない。

```
classify API → source_type, direction, line_items（粗い）→ UIプレビュー表示用のみ
Extract API  → JournalPhase5Mock型の完全な仕訳データ   → 仕訳一覧UI表示 → CSV出力
```

| 項目 | classify API | Extract API（未実装） |
|---|---|---|
| 発火タイミング | アップロード時（即時） | **選別確定時**（確定送信ボタン押下） |
| 入力 | 画像1枚 | 独自+Drive全証票をバッチ投入 |
| 出力型 | ClassifyRawResponse | **JournalPhase5Mock** |
| classifyの出力 | — | 選別確定後に**削除**（再利用価値なし） |

> 詳細: [24_upload_drive_integration.md §17](file:///c:/dev/receipt-app/docs/genzai/24_upload_drive_integration.md) 参照

### 暫定処理（Extract API未実装時）

Extract APIが未実装のため、現在は以下の暫定フローで動作:

```
暫定: classify出力 → lineItemToJournalMock()で無理やり仕訳形式に変換
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


