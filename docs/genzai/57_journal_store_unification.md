# 57. 仕訳ストア統合 — 通常仕訳とconfirmed仕訳の二重管理解消

> **作成日**: 2026-06-20
> **最終更新**: 2026-06-20
> **前提ドキュメント**: [25_past_journal.md](file:///c:/dev/receipt-app/docs/genzai/25_past_journal.md)（統合により大部分が陳腐化予定）

---

## 1. 問題の概要

現在、仕訳データが2つの独立したストア・型・ファイル・APIで管理されている。

| 項目 | 通常仕訳 | confirmed仕訳 |
|---|---|---|
| ストア | journalStore.ts | confirmedJournalsApi.ts |
| 型定義 | JournalEntryLine（domain-journal.ts） | ConfirmedJournal / ConfirmedJournalEntry（confirmed_journal.type.ts） |
| ファイル | `data/journals-{clientId}.json` | `data/confirmed_journals.json`（全顧問先混在） |
| ID体系 | `jrn_XXXXXXXX` / `jre_XXXXXXXX` | UUID |
| API | journalRoutes.ts（GET/POST/PATCH） | confirmedJournalRoutes.ts（GET/import/delete） |
| UI表示 | 仕訳一覧に常時表示 | showImportedチェックボックスON時のみ表示 |
| CRUD | 全操作可能 | 読取+一括インポート+削除のみ |
| ソート | journalListService.tsで統合ソート | confirmedToJournalRow()でJournalRowに変換してから統合 |

### なぜ問題か

1. **型の非互換**: ConfirmedJournal と JournalPhase5Mock は「互換」と書いてあるが、実際にはフィールド差異がある（labels, status, account_on_document, amount_on_document, entryId体系）。confirmedToJournalRow()（journalListService.ts L96-151）で毎回アダプタ変換が必要
2. **ファイル分離**: 通常仕訳は顧問先別ファイル、confirmed仕訳は全顧問先が1ファイルに混在。顧問先が増えるとフィルタ（`j.client_id === clientId`）のO(N)コストが増大
3. **検索の断絶**: 仕訳一覧の全列横断検索（journalListService.ts L392-431）は統合後のJournalRow[]に対して実行するが、showImported=falseだとconfirmed仕訳は検索対象外
4. **バリデーション適用範囲の曖昧さ**: 通常仕訳にはバリデーション（警告ラベル付与）があるが、confirmed仕訳はlabels=[]で固定。二重管理によりバリデーションの適用判断が複雑化
5. **MF送信結果の二重保持**: confirmedJournalsApi.applyMfIds()でMF-IDをconfirmed仕訳に書き戻すが、通常仕訳側にも送信ステータス（status='exported'）がある。同じ仕訳のMF送信情報が2箇所に分散

---

## 2. 二重管理が生まれた経緯

1. **Phase 1（2026-04）**: 通常仕訳のみ存在。journalStore.tsで管理
2. **Phase 2（2026-04-26）**: 過去仕訳機能を追加（25_past_journal.md）。MF仕訳帳CSVをインポートして参照する目的で、**別のストア**としてconfirmedJournalsApi.tsを新設。当時の設計判断: 「通常仕訳（新規作成+編集対象）と過去仕訳（参照のみ）は性質が違うから分離する」
3. **Phase 3（2026-06）**: MCP連携でMF APIから仕訳を直接取得→confirmed_journals.jsonに保存。ここで「参照のみ」の前提が崩れた: confirmed仕訳にもMF送信結果（mf_journal_id, export_status）を書き戻すCRUD操作が必要になった
4. **現在**: confirmed仕訳は「読取専用の参照データ」ではなく「MF送信ステータスを持つ仕訳レコード」に進化。通常仕訳との型差異・ストア分離が技術的負債化

---

## 3. 現状のデータフロー

```
通常仕訳:
  AIパイプライン → addJournals() → journals-{clientId}.json
                                  → 仕訳一覧に常時表示
                                  → PATCH で編集
                                  → exportMfCsv() でCSV出力
                                  → convertToMfJournal() でMF送信

confirmed仕訳:
  MF MCP sync-all → importJournals() → confirmed_journals.json（全顧問先混在）
  MF CSV import  → importJournals() → 同上
                                     → showImported ON時のみ表示
                                     → 読取専用（PATCHなし）
                                     → MF送信→applyMfIds()で書き戻し

仕訳一覧（journalListService.ts）:
  getJournals(clientId) → 通常仕訳
  + (showImported ? getConfirmedJournals(clientId).map(confirmedToJournalRow) : [])
  → 統合 → ソート → 検索 → フィルタ → ページネーション
```

---

## 3-b. Phase C: C-lite confirmedToJournalRow偽装の解体 ✅ 完了

> **元セッション**: d3cec2e6 component_analysis.md より転記（2026-06-21）

### 方針

ドメイン型は維持（JournalPhase5Mock / ConfirmedJournal）。
表示型として `JournalListRow = JournalPhase5Mock | ConfirmedJournal` を新設。
UIはsource判別で描画を切り替える。

### 判別関数

```typescript
function isMfJournal(row: JournalListRow): row is ConfirmedJournal {
  return 'source' in row && (row.source === 'mf_import' || row.source === 'system')
}
```

### normalizeJournalForUI

ConfirmedJournalに不足するフィールド（labels, status, is_read等）をデフォルト値で埋める。
テンプレート側の大規模修正を回避。

---

## 4. 2つの型の詳細比較

### ヘッダー（仕訳単位）

| フィールド | 通常仕訳（JournalRow） | ConfirmedJournal | 差異 |
|---|---|---|---|
| journalId | `jrn_XXXXXXXX` | UUID | ID体系が違う |
| client_id | ✅ | ✅ | 同じ |
| display_order | ✅（数値） | なし（confirmedToJournalRowで90000+idx生成） | ❌ |
| voucher_date | ✅ | ✅ | 同じ |
| description | ✅ | ✅ | 同じ |
| voucher_type | ✅ | なし | ❌ |
| document_id | ✅ | なし | ❌ |
| status | `'exported' \| null` | `export_status: 'exported' \| null` | フィールド名が違う |
| is_read | ✅ | なし（confirmedToJournalRowでtrue固定） | ❌ |
| deleted_at | ✅ | なし | ❌ |
| labels | ✅（配列） | なし（confirmedToJournalRowで[]固定） | ❌ |
| warning_dismissals | ✅ | なし | ❌ |
| warning_details | ✅ | なし | ❌ |
| is_credit_card_payment | ✅ | なし | ❌ |
| rule_id | ✅ | なし | ❌ |
| invoice_status | ✅ | なし | ❌ |
| memo | ✅ | ✅ | 同じ |
| staff_notes | ✅ | なし | ❌ |
| match_key | なし | ✅ | ❌ |
| vendor_id | なし | ✅ | ❌ |
| vendor_name | なし | ✅ | ❌ |
| direction | なし | ✅ | ❌ |
| source | なし | `'mf_import' \| 'system'` | ❌ |
| mf_journal_type | なし | ✅ | ❌ |
| is_closing_entry | なし | ✅ | ❌ |
| tags | なし | ✅ | ❌ |
| import_batch_id | なし | ✅ | ❌ |
| imported_at | なし | ✅ | ❌ |
| mf_transaction_no | なし | ✅ | ❌ |
| mf_raw | なし | ✅ | ❌ |
| mf_journal_id | なし | ✅ | ❌ |
| mf_journal_number | なし | ✅ | ❌ |
| mf_sent_at | なし | ✅ | ❌ |

### 仕訳行（エントリ単位）

| フィールド | JournalEntryLine | ConfirmedJournalEntry | 差異 |
|---|---|---|---|
| entryId | `string \| null` | `string` | nullable差異 |
| account | `string \| null` | `string` | nullable差異 |
| account_on_document | ✅ | なし | ❌ |
| sub_account | ✅ | ✅ | 同じ |
| department | ✅ | ✅ | 同じ |
| amount | `Yen \| null` | `number` | 型差異 |
| amount_on_document | ✅ | なし | ❌ |
| tax_category_id | ✅ | ✅ | 同じ |
| vendor_name | なし | ✅ | ❌ |
| invoice | なし | ✅ | ❌ |
| tax_amount | なし | ✅ | ❌ |

---

## 5. 影響を受けるファイル一覧

### バックエンド

| ファイル | 影響内容 |
|---|---|
| journalStore.ts | 統合ストアに置き換え |
| confirmedJournalsApi.ts | 統合ストアに吸収 |
| journalListService.ts | confirmedToJournalRow()アダプタ廃止。統合型で直接操作 |
| confirmedJournalRoutes.ts | journalRoutesに統合 or 維持 |
| mfRoutes.ts（sync-all） | importJournals()の呼び出し先変更 |
| normalizeConfirmedJournalsService.ts | 統合ストアへの参照変更 |

### フロントエンド

| ファイル | 影響内容 |
|---|---|
| JournalListLevel3Mock.vue | showImportedチェックボックスの扱い変更 |
| MockHistoryImportPage.vue | インポート先ストア変更 |

### 型定義

| ファイル | 影響内容 |
|---|---|
| domain-journal.ts | JournalEntryLineにconfirmed固有フィールド（vendor_name, invoice, tax_amount）を追加するか判断 |
| confirmed_journal.type.ts | 統合型に吸収 or 廃止 |

---

## 6. 統合方針（未確定 — ユーザー判断待ち）

### 方針A: ConfirmedJournalをjournalStoreに吸収

通常仕訳の型（JournalEntryLine）にconfirmed固有フィールドをoptionalで追加。ストアを1つに統合。

- メリット: ストア/API/UIが1系統になる。検索・ソート・フィルタが自然に統合
- デメリット: JournalEntryLineが肥大化（vendor_name, invoice, tax_amount等のoptionalフィールド増加）

### 方針B: journalStoreをConfirmedJournalベースに統一

ConfirmedJournal型を基盤とし、通常仕訳もConfirmedJournal形式で保存する。

- メリット: confirmed仕訳の方がフィールドが豊富（MFメタデータ, match_key等）。将来のMF連携で有利
- デメリット: 通常仕訳にはMFメタデータが不要。無駄なnullフィールドが増える

### 方針C: 統合型を新設

JournalEntryLineとConfirmedJournalEntryの共通部分を抽出した基底型 + 拡張フィールドで新型を定義。

- メリット: 型が綺麗。既存コードへの影響を最小化できる
- デメリット: 型定義の作業量が最大

### 方針D: ストアは統合するが型は分離維持

ファイルを1つ（journals-{clientId}.json）に統合するが、型はdiscriminated union（`source: 'ai_pipeline' | 'mf_import' | 'system'`）で分岐。

- メリット: 型安全性を維持しつつストア統合。source別の分岐が型レベルで保証される
- デメリット: unionの分岐処理が必要

---

## 7. 残作業（§25 から引き継ぐもの）

25_past_journal.md §8 の未実装12件のうち、統合後も残るもの:

| 25の# | 内容 | 統合後の扱い |
|---|---|---|
| 1 | ConfirmedJournal型定義（T-03） | 統合型に吸収 |
| 2 | CSVパーサー実装 | 残る。インポート機能は統合後も必要 |
| 3 | confirmedJournalStore.ts | journalStoreに統合 |
| 4 | confirmedJournalRoutes.ts | journalRoutesに統合 |
| 5 | MockHistoryImportPage.vue executeImport() | 残る。インポート先を統合ストアに変更 |
| 6 | 「会計ソフト」タブのデータ接続 | 残る。統合後はsource='mf_import'でフィルタ |
| 7 | hasPastJournal実データ判定 | 残る。統合ストアでmatch_key照合 |
| 8 | ヒントモーダル接続 | 残る |
| 9 | accountDetermination.ts Step 2 接続 | 残る |
| 10 | camelCase/snake_case互換アダプター | 統合型で解消 |
| 11 | 複数期間CSVの重複排除 | 残る |
| 12 | 過去仕訳からの科目コピー | 残る |

---

## 8. 関連プロジェクトファイル

| ファイル | 関連内容 | 統合後の更新 |
|---|---|---|
| 25_past_journal.md | confirmed仕訳の元設計。§4型設計, §7 DB設計, §8未実装リストが陳腐化 | 冒頭に「§57で統合。本ファイルの§4-8は廃止」の注記を追加 |
| 55_update_path_unification.md | confirmed_journalsの更新経路一元化 | 統合ストアへの経路に更新 |
| 54_sub_accounts_departments.md | confirmed仕訳のsub_account/department | §13残作業のうち#5（confirmed仕訳バリデーション）が影響 |
| 53_client_account_architecture.md | confirmedJournalsのaccountId正規化 | 統合ストアへの正規化に更新 |
| 39_mf_field_mapping.md | MF仕訳→confirmed仕訳のフィールドマッピング | 統合型へのマッピングに更新 |
| 30_audit_checklist.md | confirmed_journals.json 1537件の監査結果 | ファイル構成変更後に再監査 |
| 49_id_attribute_rename.md | ConfirmedJournal/ConfirmedJournalEntryのID属性リネーム | 統合型のID体系に反映 |
| 勘定科目と税区分バリデーションロジック.md | 二重管理によるバリデーション適用範囲の曖昧さ | 統合後にバリデーション適用範囲を再定義 |
