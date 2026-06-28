# Supabase移行前整備ロードマップ + Journal型フィールド棚卸し

---

## 核心原則

> **Supabase移行は「永続化層の実装差し替え」だけにする。**
> ドメインもUIもRepository Interfaceも触らない。

```
UI
 ↓
Journal (ドメイン型)
 ↓
Repository Interface
 ↓
JSON Repository ← ここだけ差し替え
 ↓
Supabase Repository
```

### 現状のリスク（Phase 0-2完了により一部解消済み）

~~型整理・Repository・JSONが全部混ざっている。~~ → Phase 0-2で型統一完了（Journal型に一本化済み）。
残存リスク:
- migration地獄（一度DBに入れたカラムは簡単に消せない）→ 棚卸し確定済み（本ドキュメント）で対策
- Repository InterfaceとJSON Repositoryの整理が未完 → Phase 2.5で対応完了。残りはPhase 3

---

## Phase一覧

| Phase | 内容 | Supabase前/後 | 規模 | 状態 |
|:---:|---|:---:|:---:|:---:|
| **0** | デッドコード除去 + types物理分割 | 前 | 小 | ✅完了 |
| **1** | フィールド棚卸し確定 + Journal仕様確定 | 前 | 中（最重要） | ✅完了 |
| **2** | Journal型への統一 | 前 | 中 | ✅完了（既に統一済み） |
| **2.5** | zod + Repository + Validation整理 | 前 | 中 | ✅完了（Phase 2.5a+2.5b） |
| **3** | JSON Repository完成（Interface確定） | 前 | 小 | 未着手 |
| **4** | Supabase Repository実装（並列） | 後 | 大 | 未着手 |
| **5** | Repository差し替え（JSON→Supabase） | 後 | 小 | 未着手 |

---

## Phase 0: デッドコード除去 + types物理分割（✅完了）

### 0-1. デッドコード除去（実施結果）

| ファイル | 参照元 | 判定 |
|---|:---:|---|
| `journal-ui.types.ts` | 0件 | ✅**削除済み** |
| `journal-list-row.ts` | 4件（JournalListLevel3Mock, useCellDragAndFill, useAccountCombobox, journalListService） | 現役（`JournalListRow = Journal`エイリアス + ヘルパー関数） |
| `document_mock.type.ts` | 1件（document_mock_data.ts） | 現役 |
| `document.types.ts` | 1件（supabase/document.repository.supabase.ts） | 現役 |
| `documentViewModel.ts` | 6件 | 現役 |
| `ScreenG_ui.type.ts` | 2件 | 現役 |
| `hintTypes.ts` | 2件 | 現役 |

### 廃止済み型の残存

| 型名 | 旧ファイル | 状況 |
|---|---|---|
| `JournalPhase5Mock` | `journal_phase5_mock.type.ts` | **ファイル削除済み。** コメント2箇所のみ残存（journal.type.ts, journal-list-row.ts） |
| `ConfirmedJournal` | `confirmed_journal.type.ts` | **ファイル削除済み。** 確定済み仕訳Repositoryとして型名は現役（型はJournalに統一済み） |

### @deprecated タグ（22箇所）

全て「後方互換で残置」または「将来廃止予定の注記」。現時点で安全に削除可能なものなし。

### 0-2. types物理分割（確認結果）

依存方向（正しい一方向）:
```
domain-journal.ts（基盤: VoucherType, AccountCode, JournalLabel）
      ↑ import
journal.type.ts（SSOT: Journal型の唯一の定義）
      ↑ import
repositories/types.ts（Interface集約: Repository interface + re-export）
```

| ファイル | 責務 | 行数 | 問題 |
|---|---|:---:|:---:|
| `domain-journal.ts` | 会計ドメイン定数（純粋概念） | 226 | なし |
| `journal.type.ts` | Journal型SSOT | 298 | なし |
| `repositories/types.ts` | Repository Interface集約 | 795 | なし |
| `repositories/types/*.ts` | ドメイン型分割（9ファイル） | — | なし |

### `repositories/types/index.ts` と `repositories/types.ts` の重複re-export

両方が同じ型をre-exportしている。ただし `repositories/types.ts` のre-exportが「正」で、`index.ts`は`repositories/types.ts`内部で使うためのもの。外部参照は全て `@/repositories/types`（= `repositories/types.ts`）経由。分割ファイル直接importは0件。

### 型チェック結果

`vue-tsc --noEmit`: エラー0件

---

## Phase 1: フィールド棚卸し確定 + Journal仕様確定（✅完了）

> [!IMPORTANT]
> 全59フィールドを `\b`境界付き全文検索（.ts + .vue）でカウント。
> 使用数5件以下のフィールドは**参照先を全件特定済み**。
> **保留ゼロ。全件確定。**

### 判定凡例

| 記号 | 意味 |
|:---:|---|
| ✅ | **必要** — DB化必須 |
| ❌ | **DB除外** — 導出値。アプリ層で毎回再計算。DB保存不要 |

### 1. 基本情報（8フィールド）

| # | フィールド | 型 | nullable | 使用数 | 判定 | 生成元 | 消費先 | 備考 |
|:---:|---|---|:---:|:---:|:---:|---|---|---|
| 1 | `journalId` | `string` | NO | 163 | ✅ | サーバー発番 | 全画面 | PK。`jrn-`接頭辞 |
| 2 | `client_id` | `string` | NO | 32 | ✅ | 仕訳作成時 | フィルタ | FK→clients |
| 3 | `display_order` | `number` | NO | 9 | ✅ | サーバー連番 | 一覧ソート | |
| 4 | `voucher_date` | `string\|null` | YES | 36 | ✅ | AI/MFインポート | 一覧表示・CSV | |
| 5 | `date_on_document` | `boolean` | NO | 7 | ✅ | AI層 | バリデーション | 証憑に日付記載ありか |
| 6 | `description` | `string` | NO | 250 | ✅ | AI/MF/手動 | 一覧・CSV・照合 | NOT NULL（空文字許容） |
| 7 | `voucher_type` | `string\|null` | YES | 31 | ✅ | AI層（旧） | UI表示・CSV | @deprecatedだがUI/CSV現役。source_type完全移行後にDROP |
| 8 | `source` | `JournalSource` | NO | 54 | ✅ | 仕訳作成時 | 全ロジック | 5値enum |

### 2. パイプライン3フィールド（3フィールド）

| # | フィールド | 型 | nullable | 使用数 | 判定 | 生成元 | 消費先 | 備考 |
|:---:|---|---|:---:|:---:|:---:|---|---|---|
| 9 | `source_type` | `SourceType\|null` | YES | 46 | ✅ | パイプラインStep1 | フィルタ・CSV | 11種enum |
| 10 | `direction` | `Direction\|null` | YES | 174 | ✅ | パイプラインStep1 | 科目確定・フィルタ | 4値 |
| 11 | `vendor_vector` | `VendorVector\|null` | YES | 10 | ✅ | パイプラインStep3 | 科目確定 | 66種 |

### 3. 取引先・照合（3フィールド）

| # | フィールド | 型 | nullable | 使用数 | 判定 | 生成元 | 消費先 | 備考 |
|:---:|---|---|:---:|:---:|:---:|---|---|---|
| 12 | `vendor_id` | `string\|null` | YES | 5 | ✅ | 照合Step2-3 | 取引先リンク | FK→vendors。生成: lineItemToJournalMock/mfJournalImporter。消費: journalStore(PATCH許可キー) |
| 13 | `vendor_name` | `string\|null` | YES | 8 | ✅ | 照合 or AI | 一覧表示 | |
| 14 | `match_key` | `string\|null` | YES(opt) | 8 | ✅ | normalizeVendorName() | 照合Step2 | |

### 4. 証票紐付け（2フィールド）

| # | フィールド | 型 | nullable | 使用数 | 判定 | 生成元 | 消費先 | 備考 |
|:---:|---|---|:---:|:---:|:---:|---|---|---|
| 15 | `document_id` | `string\|null` | YES | 10 | ✅ | パイプライン | 証票リンク | FK→documents |
| 16 | `line_id` | `string\|null` | YES | 5 | ✅ | パイプライン | 証票行特定 | `{documentId}_line-{index}`形式。証票内の個別行を一意特定。生成: lineItemToJournalMock L486。消費: JournalListLevel3Mock, receiptService(ログ)。MFインポートはnull固定 |

### 5. 仕訳明細（2フィールド）

| # | フィールド | 型 | nullable | 使用数 | 判定 | 生成元 | 消費先 | 備考 |
|:---:|---|---|:---:|:---:|:---:|---|---|---|
| 17 | `debit_entries` | `JournalEntryLine[]` | NO | 34 | ✅ | 全経路 | 全画面・CSV | N対N複合仕訳。DB化時は`journal_entries`テーブルに正規化 |
| 18 | `credit_entries` | `JournalEntryLine[]` | NO | 35 | ✅ | 全経路 | 全画面・CSV | 同上 |

### 6. ステータス・ワークフロー（6フィールド）

| # | フィールド | 型 | nullable | 使用数 | 判定 | 生成元 | 消費先 | 備考 |
|:---:|---|---|:---:|:---:|:---:|---|---|---|
| 19 | `status` | `JournalStatus` | YES | 225 | ✅ | ステータス遷移 | フィルタ・出力 | null/exported/historical |
| 20 | `is_read` | `boolean` | NO | 20 | ✅ | ユーザー操作 | 未読フィルタ | |
| 21 | `read_by` | `string\|null` | YES(opt) | 6 | ✅ | ユーザー操作 | 監査 | ts=3 vue=3 |
| 22 | `read_at` | `string\|null` | YES(opt) | 6 | ✅ | ユーザー操作 | 監査 | ts=3 vue=3 |
| 23 | `deleted_at` | `string\|null` | YES | 25 | ✅ | ゴミ箱操作 | フィルタ | soft delete |
| 24 | `deleted_by` | `string\|null` | YES(opt) | 10 | ✅ | ゴミ箱操作 | 監査 | ts=4 vue=6 |

### 7. ラベル・警告（3フィールド）

| # | フィールド | 型 | nullable | 使用数 | 判定 | 生成元 | 消費先 | 備考 |
|:---:|---|---|:---:|:---:|:---:|---|---|---|
| 25 | `labels` | `JournalLabelMock[]` | NO | 130 | ✅ | バリデーション | 一覧・フィルタ | DB化時はjsonb or 別テーブル |
| 26 | `warning_dismissals` | `string[]` | NO | 8 | ✅ | ユーザー操作 | バリデーション | 確認済み警告リスト |
| 27 | `warning_details` | `Record<string,string>` | NO | 20 | ❌ | バリデーション | ツールチップ | **DB除外**。`journalStore.ts` L74-77でJSON保存時に明示除外済み。`syncWarningLabelsCore()`が毎回再計算する純粋な導出値 |

#### warning_details参照先（20件）
- **型定義**: journal.type.ts, journal.schema.ts
- **生成（初期値空オブジェクト）**: lineItemToJournalMock.ts, mfCsvParser.ts, mfJournalImporter.ts
- **計算・書き込み**: journalValidationCore.ts（L399-402: `journal.warning_details = {}`→各警告の詳細メッセージを格納）
- **読み取り**: JournalListLevel3Mock.vue（L3267: ツールチップ表示）
- **伝搬**: JournalListLevel3Mock.vue（L4167: `row.warning_details ?? {}`）
- **JSON保存除外**: journalStore.ts（L74-77: `const { warning_details, ...rest } = j`で除外）
- **PATCH許可キー**: journalStore.ts（L215）
- **ラッパー**: journalValidation.ts（L46,72,80: 非破壊コピーで受け渡し）
- **ドキュメント**: typeDefinitionsData.ts, MasterFieldFlowPage.vue

### 8. 出力・クレカ判定（2フィールド）

| # | フィールド | 型 | nullable | 使用数 | 判定 | 生成元 | 消費先 | 備考 |
|:---:|---|---|:---:|:---:|:---:|---|---|---|
| 28 | `export_batch_id` | `string\|null` | YES | 5 | ✅ | CSVエクスポート | 出力履歴 | 生成: MockExportPage。消費: journalStore(PATCH許可), typeDefinitionsData |
| 29 | `is_credit_card_payment` | `boolean` | NO | 15 | ✅ | AI層 | 相手勘定分岐 | |

### 9. ルール・インボイス（3フィールド）

| # | フィールド | 型 | nullable | 使用数 | 判定 | 生成元 | 消費先 | 備考 |
|:---:|---|---|:---:|:---:|:---:|---|---|---|
| 30 | `rule_id` | `string\|null` | YES | 7 | ✅ | 学習ルール適用 | ルールリンク | FK→learning_rules |
| 31 | `invoice_status` | `'qualified'\|'not_qualified'\|null` | YES | 8 | ✅ | AI/MFインポート | UI・CSV | 2値enum + null |
| 32 | `invoice_number` | `string\|null` | YES | 7 | ✅ | AI/MFインポート | UI・CSV | T+13桁 |

### 10. メモ関連（4フィールド）

| # | フィールド | 型 | nullable | 使用数 | 判定 | 生成元 | 消費先 | 備考 |
|:---:|---|---|:---:|:---:|:---:|---|---|---|
| 33 | `memo` | `string\|null` | YES | 41 | ✅ | AI（証票メモ検出） | UI表示 | |
| 34 | `memo_author` | `string\|null` | YES | 8 | ✅ | AI | UI表示 | ts=4 vue=4 |
| 35 | `memo_target` | `string\|null` | YES | 8 | ✅ | AI | UI表示 | ts=4 vue=4 |
| 36 | `memo_created_at` | `string\|null` | YES | 8 | ✅ | AI | UI表示 | ts=4 vue=4 |

### 11. スタッフノート（2フィールド）

| # | フィールド | 型 | nullable | 使用数 | 判定 | 生成元 | 消費先 | 備考 |
|:---:|---|---|:---:|:---:|:---:|---|---|---|
| 37 | `staff_notes` | `StaffNotes\|null` | YES(opt) | 37 | ✅ | スタッフ入力 | UI・ラベル同期 | DB化時はjsonb |
| 38 | `staff_notes_author` | `string\|null` | YES(opt) | 7 | ✅ | スタッフ入力 | 表示 | |

### 12. MF送信結果（3フィールド）

| # | フィールド | 型 | nullable | 使用数 | 判定 | 生成元 | 消費先 | 備考 |
|:---:|---|---|:---:|:---:|:---:|---|---|---|
| 39 | `mf_journal_id` | `string\|null` | YES(opt) | 7 | ✅ | MF MCP送信 | MF連携 | 生成: mfJournalSender L287, confirmedJournalsApi L176。消費: mfRoutes L1418, journalStore L219 |
| 40 | `mf_journal_number` | `number\|null` | YES(opt) | 7 | ✅ | MF MCP送信 | 表示 | 同上パターン |
| 41 | `mf_sent_at` | `string\|null` | YES(opt) | 7 | ✅ | MF MCP送信 | 監査 | 同上パターン |

### 13. 出力監査（2フィールド）

| # | フィールド | 型 | nullable | 使用数 | 判定 | 生成元 | 消費先 | 備考 |
|:---:|---|---|:---:|:---:|:---:|---|---|---|
| 42 | `exported_at` | `string\|null` | YES(opt) | 8 | ✅ | CSVエクスポート | 監査 | 生成: MockExportPage L465,743。消費: journalStore L221, typeDefinitionsData |
| 43 | `exported_by` | `string\|null` | YES(opt) | 8 | ✅ | CSVエクスポート | 監査 | 同上パターン |

### 14. 監査用（4フィールド）

| # | フィールド | 型 | nullable | 使用数 | 判定 | 生成元 | 消費先 | 備考 |
|:---:|---|---|:---:|:---:|:---:|---|---|---|
| 44 | `created_at` | `string\|null` | YES(opt) | 7 | ✅ | 仕訳作成時 | 監査・ソート | |
| 45 | `updated_at` | `string\|null` | YES(opt) | 5 | ✅ | 更新時 | 監査 | ts=4 vue=1 |
| 46 | `created_by` | `string\|null` | YES(opt) | 5 | ✅ | 仕訳作成時 | 監査 | 生成: lineItemToJournalMock L506(`'AI'`)。消費: journalStore(PATCH許可), typeDefinitionsData |
| 47 | `updated_by` | `string\|null` | YES(opt) | 4 | ✅ | 更新時 | 監査 | 生成: journalStore(PATCH時設定)。消費: typeDefinitionsData。ts=3 vue=1 |

### 15. AI推定関連（4フィールド）

| # | フィールド | 型 | nullable | 使用数 | 判定 | 生成元 | 消費先 | 備考 |
|:---:|---|---|:---:|:---:|:---:|---|---|---|
| 48 | `ai_completed_at` | `string\|null` | YES(opt) | 3 | ✅ | AI処理完了時 | 監査 | 型定義+zodスキーマ+typeDefinitionsData。**現在値を書き込むコードなし**（将来のAIパイプライン完成時に使用） |
| 49 | `determination_method` | `DeterminationMethod\|null` | YES(opt) | 19 | ✅ | 科目確定Step | UI（確度表示） | |
| 50 | `prediction_score` | `number\|null` | YES(opt) | 5 | ✅ | AI推定 | 将来UI | 生成: lineItemToJournalMock L510(null固定)。消費: journalStore(PATCH許可), typeDefinitionsData。**現在は常にnull**（将来のAIスコア出力時に使用） |
| 51 | `model_version` | `string\|null` | YES(opt) | 5 | ✅ | AI処理時 | 監査 | 同上パターン。**現在は常にnull** |

### 16. MF専用メタデータ（8フィールド）

| # | フィールド | 型 | nullable | 使用数 | 判定 | 生成元 | 消費先 | 備考 |
|:---:|---|---|:---:|:---:|:---:|---|---|---|
| 52 | `mf_journal_type` | `string\|null` | YES(opt) | 7 | ✅ | MFインポート | フィルタ・CSV | 生成: mfCsvParser L290, mfJournalImporter L398。消費: MockHistoryImportPage L763 |
| 53 | `is_closing_entry` | `boolean` | YES(opt) | 4 | ✅ | MFインポート | フィルタ | 決算整理仕訳。optional。AI仕訳はfalse。ts=2 vue=2 |
| 54 | `tags` | `string\|null` | YES(opt) | 21 | ✅ | MFインポート | CSV | |
| 55 | `mf_transaction_no` | `number\|null` | YES(opt) | 16 | ✅ | MFインポート | 重複排除 | 重複排除キーの一部（client_id + mf_transaction_no + voucher_date）。confirmedJournalsApi, mfJournalImporter, JournalListLevel3Mockで使用 |
| 56 | `import_batch_id` | `string\|null` | YES(opt) | 19 | ✅ | MFインポート | バッチ管理 | バッチ削除・取得・一覧で使用。confirmedJournalsApi, mfCsvParser, mfJournalImporter |
| 57 | `imported_at` | `string\|null` | YES(opt) | 5 | ✅ | MFインポート | 表示・ソート | ts=3 vue=2 |
| 58 | `mf_raw` | `Record<string, unknown>\|null` | YES(opt) | 3 | ✅ | MF MCPインポート | データ復元 | 生成: mfJournalImporter L404。型定義+zodのみ。jsonb。MF APIレスポンス全体を保持 |
| 59 | `mf_deleted_detected_at` | `string\|null` | YES(opt) | 4 | ✅ | MF差分検出 | UI警告 | 生成: mfJournalImporter L468。消費: mfJournalImporter L464(条件判定), L471(ログ) |

### 棚卸し集計（確定版）

| 判定 | 件数 | 内訳 |
|:---:|:---:|---|
| ✅ 必要（DB化必須） | **58** | 全カテゴリの全フィールド |
| ❌ DB除外 | **1** | `warning_details`（導出値。JSON保存時に明示除外済み） |
| 🟡 保留 | **0** | **全件確定済み** |

> [!IMPORTANT]
> **全59フィールド確定。保留ゼロ。**
> - DB化: 58フィールド
> - TS型: 59フィールド全て維持（`warning_details`はDBには保存しないがアプリ内で使用）
> - `warning_details`のDB除外根拠: `journalStore.ts` L74-77で`const { warning_details, ...rest } = j`として**JSON保存時に分離除外**している

### 特記事項

| フィールド | 現状 | 備考 |
|---|---|---|
| `ai_completed_at` | 型定義のみ。**書き込みコードなし** | 将来AIパイプライン完成時に使用 |
| `prediction_score` | 常にnull | 将来のAIスコア出力時に使用 |
| `model_version` | 常にnull | 将来のモデル管理時に使用 |
| `voucher_type` | @deprecated | UI/CSV現役。source_type移行完了後にDROP |

### DB設計への示唆

1. **`debit_entries` / `credit_entries`** → `journal_entries`テーブルに正規化（FK: journalId + side + seq）
2. **`labels`** → jsonb配列 or `journal_labels`テーブル
3. **`staff_notes`** → jsonb
4. **`warning_details`** → DB保存不要（導出値。アプリ層で毎回再計算）
5. **`mf_raw`** → jsonb（別テーブル `journal_mf_raw` も検討）
6. **`voucher_type`** → @deprecated だがDB化時にも残す（UI/CSV後方互換）
7. **`line_id`** → `{documentId}_line-{index}`形式。証票内行の一意キー。nullable TEXT
8. **`mf_transaction_no`** → 重複排除キーの一部。UNIQUE制約（client_id, mf_transaction_no, voucher_date）を検討

---

## Phase 2: Journal型への統一（✅完了 — 既に統一済み）

Phase 0-1の調査結果から、型統一は既に完了していることが確認された:

- `JournalListRow = Journal`（型エイリアス）
- `JournalPhase5Mock` / `ConfirmedJournal` のファイルは物理削除済み
- `journal-ui.types.ts`（デッドコード）は Phase 0 で削除済み
- 全ての仕訳データは `Journal` 型に統一されている

---

## Phase 2.5: zod + Repository + Validation整理（✅完了 2026-06-28）

Phase 2.5は棚卸し確定結果（本ドキュメント）に基づいて実施。Phase 2.5a（初版）とPhase 2.5b（戻り値再設計）の2段階で完了。

- [x] `journal.schema.ts`のzodスキーマをJournal型の確定仕様と突合 → 3箇所enum化完了
- [x] Repository Interfaceの整理（Journal CRUD操作の型安全化） → 8メソッド化 + 戻り値再設計完了
- [x] Validation関数の整理 → SSOT達成済み（変更不要）

### 方針（議論で合意済み）

1. **JournalRepositoryは純粋CRUDのみ**。重複排除・MF-ID反映・バッチ管理等の業務ロジックはService層の責務
2. **統合方針**: 最終形は1テーブル（journals）。ただし物理的なJSON統合（confirmed_journals廃止）はPhase 3で実施
3. **段階的書き換え**: journalRoutes.tsだけRepository経由に変更。他6箇所はPhase 3タスク1で移行完了
4. **zodスキーマ**: 3箇所のenum化（小作業）を先に実施

### 設計判断（5論点の確定結果）

| # | 論点 | 確定 | 理由 |
|:---:|---|---|---|
| 1 | get()にclientId | **含める** | JSON実装の制約 + RLS + 他Repositoryとの一貫性 |
| 2 | list()のクエリ | **clientIdだけ** | 検索はQueryService（将来）の責務。今は決めない |
| 3 | delete()の意味 | **ソフトデリート** | ビジネスルール上、物理削除の要件なし。JSDocに明記 |
| 4 | create()のID発番 | **Repository外部** | パイプライン/Service層でgenerateJournalId()を呼ぶ。Repositoryはそのまま保存 |
| 5 | clientIdの要否 | **全操作に含める** | JSON実装 + RLS + 一貫性 |

### 確定Interface（改訂版 — Phase 2.5b）

> [!IMPORTANT]
> **設計原則: Repositoryは操作結果を返す。**
> - 単件操作（update/delete）: `Journal | null`で「見つかったか否か」を伝達
> - createMany: `{ added: number; ids: string[] }`でID発番結果を伝達
> - Many操作: `{ updated: number }` / `{ deleted: number }`で件数を伝達
> - 既存のVendorRepository `create(): Promise<Vendor>` パターンと整合

```typescript
interface JournalRepository {
  /** 1件取得 */
  get(clientId: string, journalId: string): Promise<Journal | null>

  /** 顧問先の全件取得 */
  list(clientId: string): Promise<Journal[]>

  /** 1件追加。発番後のJournalを返す */
  create(clientId: string, journal: Journal): Promise<Journal>

  /** 複数件追加。追加件数とID一覧を返す */
  createMany(clientId: string, journals: Journal[]): Promise<{ added: number; ids: string[] }>

  /** 1件部分更新。見つからなければnull */
  update(clientId: string, journalId: string, patch: Partial<Journal>): Promise<Journal | null>

  /** 複数件部分更新。更新件数を返す */
  updateMany(
    clientId: string,
    patches: { journalId: string; patch: Partial<Journal> }[]
  ): Promise<{ updated: number }>

  /** 1件ソフトデリート（deleted_atを設定）。見つからなければnull */
  delete(clientId: string, journalId: string): Promise<Journal | null>

  /** 複数件ソフトデリート。削除件数を返す */
  deleteMany(clientId: string, journalIds: string[]): Promise<{ deleted: number }>
}
```

**8メソッド。業務ロジックなし。CRUD + Many版のみ。操作結果を全て返す。**

#### 初版（廃止）からの改訂経緯

> [!CAUTION]
> **初版は全メソッドの戻り値が`Promise<void>`だった。これにより以下の問題が発生:**
>
> 1. **PATCH/DELETEの404応答が消失**: update/deleteが「見つからなかった」を返せないため、journalRoutes.tsの404チェックコードを削除せざるを得なかった
> 2. **POST /:clientIdの追加件数が消失**: createManyが追加件数を返せないため、`added: body.journals.length`（リクエスト件数）で代替した
> 3. **ID発番結果が消失**: addJournals()の副作用（配列直接変更）に依存する必要があった
>
> **根本原因:** Repositoryが「操作」しか返しておらず、「操作結果」を返していなかった。

#### 改訂の判断根拠

| 戻り値方式 | 検討結果 |
|---|---|
| `Promise<void>` | ❌ 操作結果が消失。404/件数/IDが返せない |
| `Promise<Journal \| null>` | ✅ 単件操作に最適。シンプル。既存パターン踏襲 |
| `Promise<UpdateResult<T>>` 専用型 | ❌ 過剰設計。`Journal \| null`と情報量が同じ |
| `Promise<{ added: number; ids: string[] }>` | ✅ createMany専用。ID発番の副作用依存を排除 |
| `Promise<{ updated/deleted: number }>` | ✅ Many操作。低コストで将来困らない |

#### Supabase移行時の対応

| メソッド | JSON mock | Supabase |
|---|---|---|
| `update → Journal \| null` | `updateJournal()` の戻り値をそのまま返す | `UPDATE ... RETURNING *` |
| `delete → Journal \| null` | `deleteJournal()` の戻り値をそのまま返す | `UPDATE deleted_at ... RETURNING *` |
| `createMany → { added, ids }` | `addJournals()` 後にIDを収集して返す | `INSERT ... RETURNING journal_id` |
| `updateMany → { updated }` | メモリ更新→save()。更新件数をカウント | `UPDATE ... WHERE id IN (...)`。affected rows |
| `deleteMany → { deleted }` | メモリ更新→save()。削除件数をカウント | `UPDATE deleted_at ... WHERE id IN (...)`。affected rows |

### mock実装（journalStoreラップ）

| Interfaceメソッド | journalStore関数 | 戻り値 |
|---|---|---|
| `get(clientId, journalId)` | `getJournals(clientId)` → `.find()` | `Journal \| null` |
| `list(clientId)` | `getJournals(clientId)` | `Journal[]` |
| `create(clientId, journal)` | `addJournals(clientId, [journal])` → 発番後のjournalを返す | `Journal` |
| `createMany(clientId, journals)` | `addJournals(clientId, journals)` → 件数とIDを返す | `{ added, ids }` |
| `update(clientId, journalId, patch)` | `updateJournal()` の戻り値をそのまま返す | `Journal \| null` |
| `updateMany(clientId, patches)` | メモリ更新→1回save()→更新件数を返す | `{ updated }` |
| `delete(clientId, journalId)` | `deleteJournal()` の戻り値をそのまま返す | `Journal \| null` |
| `deleteMany(clientId, journalIds)` | メモリ更新→1回save()→削除件数を返す | `{ deleted }` |

### HTTP実装（フロントエンド用）

| メソッド | HTTPメソッド | エンドポイント | 戻り値 |
|---|---|---|---|
| `get` | `GET` | `/api/journals/:clientId` → 全件取得 → `.find()` | `Journal \| null` |
| `list` | `GET` | `/api/journals/:clientId` | `Journal[]` |
| `create` | `POST` | `/api/journals/:clientId` → serverIds[0]で発番後ID取得 | `Journal` |
| `createMany` | `POST` | `/api/journals/:clientId` → added/serverIdsで結果取得 | `{ added, ids }` |
| `update` | `PATCH` | `/api/journals/:clientId/:journalId` → 成功後get()で取得 | `Journal \| null` |
| `updateMany` | ループでPATCH | 同上 | `{ updated }` |
| `delete` | `DELETE` | `/api/journals/:clientId/:journalId` → 削除前にget()で取得 | `Journal \| null` |
| `deleteMany` | ループでDELETE | 同上 | `{ deleted }` |

### journalRoutes.tsの変更

journalStore直接importを、mock Repository経由に変更:

```diff
-import {
-  getJournals,
-  saveJournals,
-  addJournals,
-  updateJournal,
-  deleteJournal,
-} from '../services/journalStore';
+import { createMockRepositories } from '../../repositories/mock';
+const repos = createMockRepositories();
+const journalRepo = repos.journal;
```

各エンドポイントの呼び出しを変更:

| エンドポイント | 変更前 | 変更後 |
|---|---|---|
| `GET /:clientId` | `getJournals(clientId)` | `journalRepo.list(clientId)` |
| `PUT /:clientId` | `saveJournals(clientId, body.journals)` | journalStore直呼び維持（Phase 3で廃止判断） |
| `POST /:clientId` | `addJournals(clientId, body.journals)` | `journalRepo.createMany(clientId, body.journals)` |
| `PATCH /:clientId/:journalId` | `updateJournal(clientId, journalId, patch)` | `journalRepo.update()` → nullなら404 |
| `DELETE /:clientId/:journalId` | `deleteJournal(clientId, journalId)` | `journalRepo.delete()` → nullなら404 |

> [!WARNING]
> **PUT（全件上書き）の扱い:**
> 現在の`saveJournals()`は全件上書き。Repository Interfaceにはこの操作がない。
> → **今回は対応しない。** PUT /:clientIdはjournalStore直呼びのまま維持。Phase 3で廃止判断。

### zodスキーマ3箇所enum化

```diff
-  source_type: z.string().nullable(),
+  source_type: z.enum([
+    'receipt', 'invoice_received', 'tax_payment',
+    'bank_statement', 'cash_ledger', 'credit_card',
+    'journal_voucher', 'invoice_issued', 'receipt_issued',
+    'non_journal', 'supplementary_doc', 'other',
+  ]).nullable(),

-  direction: z.string().nullable(),
+  direction: z.enum(['expense', 'income', 'transfer', 'mixed']).nullable(),

-  determination_method: z.string().nullable().optional(),
+  determination_method: z.enum([
+    't_number', 'match_key', 'learning_rule',
+    'industry_vector', 'ai_fallback',
+    'manual', 'imported', 'legacy',
+  ]).nullable().optional(),
```

### zodスキーマ突合結果

**集計:** 59フィールド中 ✅一致/修正済み=56、△許容=3（修正しない）。⚠️zodが緩い=0（Phase 2.5aで3箇所とも修正完了）

修正しない2箇所（理由あり）:
1. `labels`（L117）: `z.array(z.string())` のまま維持。`syncWarningLabelsCore()`が動的にラベルを追加するためenum化不可
2. `vendor_vector`（L91）: `z.string()` のまま維持。66種は多すぎ。将来追加もある

### confirmedJournalsApiのデータ確認結果（2026-06-28実施）

| 項目 | 結果 | 対応 |
|---|---|---|
| `determination_method`未設定 | **1,898件（全件）** | `migrateLegacyDeterminationMethod()` 追加済み。全件に`'legacy'`を設定 |
| 英語概念ID（`cash`/`consumables`） | **0件** | `migrateConceptIdToMasterId()` **不要**。import・呼び出しを削除済み |
| zodバリデーション | 未実施だった | `journalSchema.safeParse()` 追加済み |
| `warning_details`永続化除外 | 未実施だった | `save()`で除外処理追加済み |

### Phase 2.5で変更しなかったもの（理由）

| 対象 | 理由 |
|---|---|
| journalListService.ts等6箇所のjournalStore直接import | Phase 3タスク1で移行完了 |
| confirmedJournalsApi.ts / ConfirmedJournalRepository | Phase 3でJSON統合時に廃止 |
| `labels`のzod厳密化 | 導出ラベルが動的追加されるためenum化不可 |
| `vendor_vector`のzod厳密化 | 66種は多すぎ。z.string()で十分 |
| journalValidationCore.ts | SSOT達成済み。変更不要 |
| validateDebitCreditBalance()の移動 | journalStore内プライベート。Supabase移行時にDB CHECK制約に置換 |

### Validation整理状況（SSOT達成済み。変更不要）

```
journalValidationCore.ts（SSOT。ロジック本体）
        ↑
journalValidation.ts（API側ラッパー。非破壊コピー付き）
        ↑
journalWarningSync.ts（フロント側re-export。後方互換）
```

| ファイル | 役割 | 行数 |
|---|---|:---:|
| journalValidationCore.ts | SSOT（ロジック本体） | 669行 |
| journalValidation.ts | API側ラッパー（非破壊コピー付き） | 90行 |
| journalWarningSync.ts | フロント側re-export | 27行 |
| journalStore.ts内 validateDebitCreditBalance() | 借方貸方合計チェック（プライベート） | L185-199 |

### 将来のService構成（Phase 3以降）

```
JournalRepository（永続化 + 操作結果）
        ↑
        │
──────────────────────────────
JournalImportService    ← 重複排除、CSVパース、バッチ管理
JournalExportService    ← MF送信、CSV出力、MF-ID反映
JournalQueryService     ← ソート、フィルタ、検索、ページネーション
JournalValidationService ← 既存SSOT（変更なし）
──────────────────────────────
        ↑
     API Routes / UI
```

### 作業順序（全完了）

| 順番 | 内容 | ファイル数 | 状態 |
|:---:|---|:---:|:---:|
| ① | zodスキーマ3箇所enum化 | 1 | ✅完了 |
| ② | JournalRepository Interface拡充 | 1 | ✅完了 |
| ③ | JSON mock実装（journalStoreラップ） | 1（上書き） | ✅完了 |
| ④ | HTTP実装拡充 | 1 | ✅完了 |
| ⑤ | mock/index.ts登録 | 1 | ✅完了 |
| ⑥ | journalRoutes.ts書き換え | 1 | ✅完了 |
| ⑦ | 型チェック + ビルド検証 | — | ✅完了 |
| ⑧ | Interface戻り値変更（Phase 2.5b） | 1 | ✅完了 |
| ⑨ | mock実装の戻り値対応（Phase 2.5b） | 1 | ✅完了 |
| ⑩ | HTTP実装の戻り値対応（Phase 2.5b） | 1 | ✅完了 |
| ⑪ | journalRoutes.ts 404復元 + added復元（Phase 2.5b） | 1 | ✅完了 |
| ⑫ | 型チェック + ビルド検証（Phase 2.5b） | — | ✅エラー0件 |
| **合計** | | **6ファイル** |

### journalStore.ts の内部構造（全294行）

#### キャッシュ構造

```typescript
// L56: Record<string, unknown>[] でデータ保持（Journal型ではない）
const journalCache = new Map<string, Record<string, unknown>[]>();
```

- キー: `clientId`（顧問先ID）
- 値: `Record<string, unknown>[]`（型安全ではない。`as T[]`キャストで返す）
- ファイル: `data/journals-{clientId}.json`（L58-62。clientIdをサニタイズ）

#### 公開関数一覧（6関数）

| 関数 | 行 | シグネチャ | 備考 |
|---|:---:|---|---|
| `getJournals<T>()` | L144 | `(clientId: string): T[]` | 型パラメータで用途特化型に変換。内部は`as T[]`キャスト |
| `saveJournals()` | L149 | `(clientId: string, journals: Record<string, unknown>[]): void` | 全件上書き。autoSave用 |
| `addJournals()` | L156 | `(clientId: string, newJournals: Record<string, unknown>[]): number` | **サーバーがID上書き発番**（L159-171）。戻り値は追加件数 |
| `updateJournal()` | L233 | `(clientId: string, journalId: string, patch: Record<string, unknown>): Record<string, unknown> \| null` | **ホワイトリスト方式**（PATCHABLE_FIELDS, L208-230）。毎回save() |
| `deleteJournal()` | L280 | `(clientId: string, journalId: string): Record<string, unknown> \| null` | **ソフトデリート**（`deleted_at = now()`）。毎回save() |
| `countJournals()` | L291 | `(clientId: string): number` | 件数取得 |

#### PATCHホワイトリスト（PATCHABLE_FIELDS, L208-230）

`journalId`, `client_id`, `created_at`, `created_by`, `source`は上書き禁止。以下のみPATCH可能:

```
voucher_date, date_on_document, description, voucher_type, direction,
debit_entries, credit_entries, status, deleted_at, is_read,
labels, warning_dismissals, warning_details, vendor_id, vendor_name,
vendor_vector, mf_journal_id, mf_journal_number, mf_sent_at,
export_batch_id, exported_at, exported_by, rule_id,
determination_method, prediction_score, model_version,
invoice_status, invoice_number, is_credit_card_payment,
memo, memo_author, memo_target, memo_created_at,
staff_notes, staff_notes_author
```

（34フィールド）

### journals vs confirmed_journals データ比較

| | journals | confirmed_journals |
|---|---|---|
| **ファイル構造** | `journals-{clientId}.json`（**顧問先別**。複数ファイル） | `confirmed_journals.json`（**全社1ファイル**） |
| **データ型** | `Journal`（統一済み） | `Journal`（統一済み） |
| **管理クラス** | journalStore.ts（294行） | confirmedJournalsApi.ts（244行） |
| **キャッシュ** | `Map<clientId, Record<string, unknown>[]>` | `let journals: Journal[]`（全社配列。型付き） |
| **source値** | `ai_pipeline` / `manual` | `mf_import` / `system` / `legacy` |
| **公開関数** | getJournals, saveJournals, addJournals, updateJournal, deleteJournal, countJournals（6個） | getAll, replaceAll, getByClientId, findByMatchKey, importJournals, deleteByBatchId, deleteByClientId, countByClientId, applyMfIds, getByBatchId, getImportBatches, loadConfirmedJournals（12個） |
| **ID発番** | サーバー側（`generateJournalId()`。crypto.randomBytes） | なし（呼び出し側が設定済み） |
| **zodバリデーション** | あり（loadClient, updateJournal） | あり（Phase 2.5aで追加済み） |
| **移行スクリプト** | あり（determination_method） | あり（migrateLegacyDeterminationMethod。Phase 2.5aで追加済み） |
| **更新頻度** | 高（毎日。科目変更、ラベル操作等） | 低（インポート時のみ。編集はapplyMfIdsだけ） |
| **一覧表示** | 常に表示 | `showImported=true`の時だけ結合表示 |

**統合判断:** 最終形は1テーブル（journals）。`source`フィールドで区別可能。物理的なJSON統合（confirmed_journals.json廃止）はPhase 3で実施。

**confirmedJournalsApi.ts固有の業務ロジック（Repository Interfaceに含めない。Service層に移動する対象）:**

| 関数 | 行 | 責務 | 移行先（Phase 3） |
|---|:---:|---|---|
| `importJournals()` | L106 | 重複排除付き一括追加（`client_id + mf_transaction_no + voucher_date`でSet判定） | JournalImportService |
| `applyMfIds()` | L167 | MF送信結果のID書き戻し（`mf_journal_id`, `mf_journal_number`, `mf_sent_at`, `status='exported'`設定）。ループ後1回save() | MfExportService（Repository.updateMany()で実現） |
| `deleteByBatchId()` | L131 | `import_batch_id`一致のfilter削除。物理削除 | JournalImportService |
| `deleteByClientId()` | L143 | 顧問先全件削除。物理削除 | 管理ツール専用 |
| `getImportBatches()` | L199 | バッチ集計（Map集約→ソート。imported_at/count/min_voucher_date/max_voucher_date） | JournalImportService or JournalQueryService |
| `replaceAll()` | L80 | 全件上書き（正規化スクリプト用） | 管理ツール専用。Repository Interfaceに含めない |
| `loadConfirmedJournals()` | L36 | 起動時JSON読み込み（L243で自動実行） | Repository初期化に統合 |

| # | ファイル | import内容 | 状態 |
|:---:|---|---|---:|
| 1 | journalRoutes.ts | ~~getJournals, saveJournals, addJournals~~ | ✅全廃（Phase 3タスク3。PUT廃止+validate/hints/generate移行） |
| 2 | journalListService.ts | getJournals | ✅Repository経由に移行済み（Phase 3タスク1） |
| 3 | exportListService.ts | getJournals | ✅Repository経由に移行済み（Phase 3タスク1） |
| 4 | mfJournalSender.ts | updateJournal | ✅Repository経由に移行済み（Phase 3タスク1） |
| 5 | progressListService.ts | getJournals | ✅Repository経由に移行済み（Phase 3タスク1） |
| 6 | mfRoutes.ts | getJournals | ✅Repository経由に移行済み（Phase 3タスク1） |
| 7 | admin.ts | getJournals | ✅Repository経由に移行済み（Phase 3タスク1） |

**confirmedJournalsApiを直接importしている箇所（Phase 3タスク2完了後: 1箇所のみ）:**

| # | ファイル | import内容 | 状態 |
|:---:|---|---|:---:|
| 1 | confirmedJournal.repository.mock.ts | getByClientId, findByMatchKey, getImportBatches, importJournals, deleteByBatchId, getByBatchId | 対象外（Repository mock自体） |
| ~~2~~ | ~~mfJournalImporter.ts~~ | ~~importJournals, getByClientId~~ | ✅Repository経由に移行済み |
| ~~3~~ | ~~normalizeConfirmedJournalsService.ts~~ | ~~getAll, replaceAll~~ | ✅Repository経由に移行済み |
| ~~4~~ | ~~journalListService.ts~~ | ~~getByClientId~~ | ✅Repository経由に移行済み |
| ~~5~~ | ~~confirmedJournalService.ts~~ | ~~複数関数~~ | ✅Repository経由に移行済み |
| ~~6~~ | ~~confirmedJournalRoutes.ts~~ | ~~複数関数~~ | ✅Repository経由に移行済み |
| ~~7~~ | ~~mfRoutes.ts~~ | ~~getAll, replaceAll, deleteByClientId~~ | ✅Repository経由に移行済み |

---

## Phase 3〜5（計画）

### Phase 3: JSON Repository完成（Interface確定）
- [x] journalStore直接import残存6箇所のRepository経由移行（Phase 3タスク1。2026-06-28完了）
- [x] confirmedJournalsApi直接import 6箇所のRepository経由移行（Phase 3タスク2。2026-06-28完了。11ファイル変更）
- [x] PUT /:clientId（全件上書き）廃止 + journalRoutes.ts内journalStore全廃（Phase 3タスク3。2026-06-28完了。2ファイル変更）
- [x] ~~confirmed_journals.jsonの物理統合~~ → Supabase移行でjournalsテーブル1枚に吸収。不要と判断（2026-06-28）

### Phase 3.5: Pipelineコア直接import移行（Supabase移行前）

> 棚卸し: [store_direct_import_inventory.md](file:///C:/Users/kazen/.gemini/antigravity-ide/brain/2efc35e5-fd85-4597-a9c8-7cb0fb780331/store_direct_import_inventory.md)（全21 Store。①.5/②/対象外の3分類）

- [ ] vendorStore 4箇所（accountDetermination.ts, vendorRoutes.ts, vendorListService.ts, server.ts）
- [ ] learningRuleStore 2箇所（firstAi.service.ts, learningRuleRoutes.ts）
- [ ] industryVectorStore 2箇所（firstAi.service.ts, industryVectorRoutes.ts）

### Phase 4: Supabase移行

- [ ] documentsテーブル差し替え
- [ ] journalsテーブル差し替え（confirmed_journals吸収）
- [ ] マスタ系差し替え + 残りStore直接import 52件のRepository移行

#### Phase 3タスク1: journalStore直接import 6箇所のRepository経由移行（✅完了 2026-06-28）

##### 背景

Phase 2.5で`journalRoutes.ts`をRepository経由に移行済み。残り6箇所がjournalStoreを直接importしている。

##### 調査結果（実コード突合済み）

**6箇所の使用パターン分類:**

| # | ファイル | 関数 | 使用行 | パターン | 型パラメータ | 問題点 |
|:---:|---|---|:---:|---|---|---|
| 1 | journalListService.ts | `getJournals` | L425 | `getJournals<Journal>(clientId)` | `Journal`（正規型） | **なし。** そのまま`list()`に置換可能 |
| 2 | exportListService.ts | `getJournals` | L159, L342 | `getJournals<JournalRaw>(clientId)` | **ローカル型`JournalRaw`** | ⚠️ 型不一致。`list()`は`Journal[]`を返す |
| 3 | mfJournalSender.ts | `updateJournal` | L293 | `updateJournal(clientId, id, patch)` | なし（`Record<string, unknown>`） | ⚠️ patchが`Record<string, unknown>`。Repository Interfaceは`Partial<Journal>` |
| 4 | progressListService.ts | `getJournals` | L48 | `getJournals<ProgressJournalRecord>(clientId)` | **ローカル型** | ⚠️ 型不一致 |
| 5 | mfRoutes.ts | `getJournals` | L1456 | `getJournals<SendableJournal>(clientId)` | **ローカル型** | ⚠️ 型不一致 |
| 6 | admin.ts | `getJournals` | L156, L496 | `getJournals(clientId)`, `getJournals<JournalRecord>(clientId)` | 型なし + **ローカル型** | ⚠️ 型不一致 |

**核心的問題: `getJournals<T>()`のジェネリクス**

journalStoreの`getJournals<T>(clientId)`は内部で`as T[]`キャストしてどんな型でも返せる。
一方、Repository Interfaceの`list(clientId)`は`Promise<Journal[]>`を返す。

**6箇所中5箇所がローカル型を使用**しているため、単純にimportを差し替えるだけでは型エラーが発生する。

##### 設計判断（3問題の対策案）

**問題1: ローカル型（JournalRaw, ProgressJournalRecord, SendableJournal, JournalRecord）**

| 案 | 内容 | メリット | デメリット |
|:---:|---|---|---|
| A | `list()`で取得後、呼び出し側で`as JournalRaw`キャスト | 最小変更 | 型安全性が低い（既存と同等） |
| B | ローカル型を廃止し、全て`Journal`型を使用 | 型安全 | 各Service内のフィールドアクセスが冗長になる可能性 |
| **C（採用）** | `list()`の戻り値を`Journal[]`のまま受けて、必要なフィールドだけ使う | 型安全かつ実用的 | ローカル型定義を削除する必要あり |

**採用理由:** Journal型は59フィールド全て定義済み。ローカル型は「必要なフィールドだけ切り出した」もの。Journal型で受けて必要なフィールドだけ使えば、ローカル型は不要。`admin.ts` L156の`getJournals(clientId)`（型パラメータなし）は`Record<string, unknown>[]`として使っているが、`.deleted_at`や`.status`でフィルタしているだけなので、`Journal[]`で受ければ問題ない。

**問題2: 同期→非同期変更**

Repository Interfaceの`list()`は`Promise<Journal[]>`を返すため、全ての呼び出し元を`async`に変更する必要がある。

| ファイル | 呼び出し元の関数 | 変更前async? |
|---|---|:---:|
| journalListService.ts | `getJournalList()` | ❌ 同期 |
| exportListService.ts | `getExportList()`, `getExportDetail()` | ❌ 同期 |
| progressListService.ts | `buildJournalSummary()` → `buildProgressRows()` → `getProgressList()` | ❌ 同期 |
| mfRoutes.ts L1456 | `app.post('/send-journals/:clientId', async ...)` | ✅ async |
| admin.ts L156 | `app.get('/dashboard', (c) => ...)` | ❌ 同期 |
| admin.ts L496 | `app.get('/journal-summary', (c) => ...)` | ❌ 同期 |

**判断:** 全てasyncに変更。Honoは`async`ハンドラをサポート（公式仕様）。JSON mock実装は内部的に同期だが`Promise`でラップされている。ランタイムコストは`await`のマイクロタスク1回のみ。`buildProgressRows()`内は`clientList.map()` → `Promise.all(clientList.map(async ...))`に書き換え。

**問題3: mfJournalSender.tsのupdateJournal**

`updateJournal(clientId, id, patch)`のpatchは`Record<string, unknown>`。Repository Interfaceの`update()`は`patch: Partial<Journal>`を要求。

- patchで使用している4フィールド（`mf_journal_id`, `mf_journal_number`, `mf_sent_at`, `status`）は全てJournal型に存在する（棚卸し済み: #39, #40, #41, #19）
- `Record<string, unknown>`より`Partial<Journal>`の方が型安全
- キャスト不要。そのまま型が通る
- `applyMfSendResults()`が同期関数 → `async`に変更が必要
- 呼び出し元（mfRoutes.ts L1508）に`await`を追加

##### 変更方針（5項目）

1. import文を`journalStore`から`repositories/mock`に変更
2. `getJournals<T>(clientId)` → `await journalRepo.list(clientId)` に変更
3. ローカル型（`JournalRaw`等）を廃止し、`Journal`型で受ける
4. 同期関数を`async`に変更
5. `updateJournal()` → `await journalRepo.update()` に変更（mfJournalSender.ts）

##### 変更ファイル（6 Service/Route + 3 呼び出し元Route = 9ファイル）

| # | ファイル | 変更内容 |
|:---:|---|---|
| 1 | journalListService.ts | import変更。`getJournals<Journal>()` → `await journalRepo.list()`。`getJournalList()` → async |
| 2 | exportListService.ts | import変更。ローカル型`JournalRaw`廃止。`getExportList()`/`getExportDetail()` → async |
| 3 | mfJournalSender.ts | import変更。`updateJournal()` → `await journalRepo.update()`。patch型: `Record<string, unknown>` → `Partial<Journal>`。`applyMfSendResults()` → async |
| 4 | progressListService.ts | import変更。ローカル型`ProgressJournalRecord`廃止。`buildJournalSummary()`/`buildProgressRows()`/`getProgressList()` → async。`clientList.map()` → `Promise.all(clientList.map(async ...))` |
| 5 | mfRoutes.ts | import変更。`getJournals<SendableJournal>()` → `await journalRepo.list()`。`applyMfSendResults()` → `await`追加 |
| 6 | admin.ts | import変更。ローカル型`JournalRecord`廃止。ルートハンドラ2つ → async。`getJournals()` → `await journalRepo.list()` |
| 7 | journalRoutes.ts | `getJournalList()` → `await getJournalList()` 2箇所 |
| 8 | exportRoutes.ts | `getExportList()`/`getExportDetail()` → `await` 2箇所 |
| 9 | progressRoutes.ts | `getProgressList()` → `await` 1箇所 |

##### 廃止したローカル型（4型）

| 型 | ファイル | 理由 |
|---|---|---|
| `JournalRaw`（2箇所） | exportListService.ts | Journal型の部分集合。Repository.list()がJournal[]を返すため不要 |
| `ProgressJournalRecord` | progressListService.ts | 同上 |
| `JournalRecord` | admin.ts | 同上 |

##### 残存するjournalStore直接import（2箇所。想定通り）

| ファイル | 理由 |
|---|---|
| journal.repository.mock.ts | Repository自体のjournalStoreラップ（正常） |
| journalRoutes.ts | PUT用のsaveJournals（Phase 3廃止判断待ち） |

##### 検証

```bash
npx vue-tsc --noEmit        # エラー0件
npx vite build              # 成功
grep -rn "from.*journalStore" src/ --include="*.ts"
# journal.repository.mock.ts と journalRoutes.ts（PUT用）だけ残存 → 想定通り
```


### Phase 4: Supabase Repository実装（並列）
- [ ] DB設計（本ドキュメントの棚卸し表 + DB設計への示唆に基づく）
- [ ] Supabase Repository実装（Repository Interfaceに準拠）

### Phase 5: Repository差し替え（JSON→Supabase）
- [ ] JSON Repository → Supabase Repository の差し替え
- [ ] UIもドメインもRepository Interfaceも触らない

---

## バックログ再分類

| タスクID | 旧分類 | 新分類 | 理由 |
|:---:|:---:|:---:|---|
| A-2 | 🔴即対応（重大） | Phase 0-2（✅完了） | 型の責務重複は既に解消済み。物理分割の確認のみ |
| A-3 | 🔴即対応（重大） | Phase 1（✅完了） | 実験スキーマ。棚卸しで全件確定済み |

---

## 次のアクション

Phase 3タスク1～3完了。残り:
1. confirmed_journals.jsonの物理統合計画（1テーブル化）

### journalStore直接import最終状態（Phase 3タスク3完了後）

| ファイル | journalStore import | 状態 |
|---|---|:---:|
| journal.repository.mock.ts | getJournals, saveJournals, addJournals, countJournals | ✅（唯一。Repository mock自体） |

その他全ファイル: **0件**（完全移行済み）

### Phase 3タスク3実施内容（★2ファイル変更 2026-06-28）

**1. journalRoutes.ts:**
- PUT /:clientId エンドポイント削除（廃止理由コメント記載）
- journalStoreのimport全廃（getJournals/saveJournals/addJournals）
- createMockRepositories().journalに統一
- validate/validate-all: getJournals→journalRepo.list()
- hints: getJournals→journalRepo.list()
- supporting-match: getJournals→journalRepo.list()
- generate: addJournals→journalRepo.createMany()

**2. useJournals.ts:**
- saveToServer()（PUT全件上書き）削除
- deep watch autoSave削除
- 読み取り専用に変更
- 廃止理由: Phase Cで全更新がPATCH API移行済み。autoSaveは冗長な二重保存だった

---

## 発見した設計負債

### DL-060: Client型とSourceJournal型で課税方式（consumptionTaxMode）の値域が異なる

**発見日:** 2026-06-28（Phase 3タスク2実施中）

**問題:**

| 型 | フィールド名 | 値域 | 定義箇所 |
|---|---|---|---|
| Client（DB/Repository型） | `consumptionTaxMode` | `'individual' \| 'proportional' \| 'simplified' \| 'exempt'` | `repositories/types/client.types.ts` L39 |
| SourceJournal（MF送信用） | `consumption_tax_mode` | `'general' \| 'general_proportional' \| 'general_individual' \| 'simplified' \| 'exempt'` | `api/services/journalToMfConverter.ts` L73 |
| ConsumptionTaxModeUi（UI型） | — | `'individual' \| 'proportional' \| 'simplified' \| 'exempt'` | `types/ui.type.ts` L58 |

**値域マッピング（現在のmfRoutes.tsで手動マッピング）:**

| Client側 | SourceJournal側 | 意味 |
|---|---|---|
| `individual` | `general_individual` | 本則課税（個別対応） |
| `proportional` | `general_proportional` | 本則課税（一括比例） |
| `simplified` | `simplified` | 簡易課税 |
| `exempt` | `exempt` | 免税 |

**暫定対処:** mfRoutes.tsの`send-journals`ハンドラ内で`TAX_MODE_MAP`による手動変換を実施。

**本来あるべき姿:** 共通の課税方式型を1箇所で定義し、Client型・SourceJournal型・UI型の全てがそれを参照する。マッピングではなく型統一。

**対応時期:** Supabase移行時または次のフィールド整理フェーズで統一推奨。現在の手動マッピングは動作するが、値の追加時にマッピング漏れリスクがある。

**備考:** SourceJournalの`general`（本則課税・未分類）はClient型に対応する値がない。Client登録時に必ず`individual`/`proportional`のどちらかを選択するため、`general`はSourceJournal独自の概念。統一時にこの差異の取り扱いを決める必要がある。
