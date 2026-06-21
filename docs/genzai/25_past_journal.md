# 25_過去仕訳機能 設計・実装ドキュメント

> **作成日**: 2026-04-26  
> **最終更新**: 2026-04-29（型設計をentries[]構造に刷新。MF CSV列構造・利用用途全件列挙を追加）  
> **目的**: 過去仕訳の取込・照合・活用に関する設計と実装状況をまとめる  
> **パイプライン位置**: ④科目確定AI の参照データ ＋ ⑤仕訳一覧の参照UI

---

## 1. 機能概要

過去仕訳機能は、MFクラウド会計からエクスポートした仕訳帳CSVを取り込み、新規証票の仕訳確定時に「過去の類似仕訳パターン」を参照できるようにする機能。

### パイプラインでの位置

```
① アップロード → ② 証票分類AI → ③ 選別 → ④ 科目確定AI → ⑤ 仕訳一覧 → ⑥ エクスポート
                                                │                    │
                                           過去仕訳参照          過去仕訳検索UI
                                           （AI精度向上）        （スタッフ確認用）
```

### 2つの利用経路

| 経路 | 利用者 | 目的 |
|------|--------|------|
| **AI参照** | 科目確定AI（④） | 同じ取引先・類似金額の過去仕訳を参照し、科目推定精度を向上 |
| **手動参照** | スタッフ（⑤） | 仕訳一覧で過去仕訳検索モーダルを開き、科目確認・コピーに利用 |

---

## 2. 利用用途 — 全8件

| # | 用途 | 消費箇所 | 主要フィールド |
|---|------|----------|---------------|
| U-1 | **Step 2: 過去仕訳照合** | `accountDetermination.ts`（未実装）/ `ConfirmedJournalRepository.findByMatchKey()` | clientId, matchKey, entries[].account, direction |
| U-2 | **一意性判定（DL-028）** | accountDetermination内で判定予定 | vendorId, entries[].account（種類数カウント） |
| U-3 | **仕訳一覧: 過去仕訳検索モーダル「会計ソフトから取り込んだ過去仕訳」タブ** | PastJournalSearchModal.vue（⑥-3で分離済み。旧JournalListLevel3Mock.vue内） | voucher_date, description, debit_entries[].account/sub_account/tax_category_id, credit_entries同様, labels |
| U-4 | **仕訳一覧: ヒントモーダル「過去の類似仕訳」** | JournalListLevel3Mock.vue（src/components/）（現在「🚧工事中」） | 同上 |
| U-5 | **学習ルール作成の参考材料** | MockLearningPage.vue（過去仕訳検索モーダル） | vendorName, matchKey, date, entries[].account, amount, sourceType |
| U-6 | **学習ルール自動提案（将来）** | 未実装 | vendorId, matchKey, entries[].account（パターン検出） |
| U-7 | **科目候補スコアリング（将来）** | accountDetermination candidates | vendorId, entries[].account（頻度集計） |
| U-8 | **メガベンダー判定代替（DL-028）** | accountDetermination内（将来） | vendorId, entries[].account（種類数） |

---

## 3. MF仕訳帳CSV列構造（23列）

> MFクラウド会計「仕訳帳」→「エクスポート」で取得するCSV。

| # | MFヘッダ | 型 | 備考 |
|---|----------|-----|------|
| 1 | **取引No** | number | **複合仕訳のグループキー**。同一取引Noの複数行が1つの仕訳 |
| 2 | 取引日 | string | `YYYY/MM/DD` |
| 3 | 借方勘定科目 | string | MF科目名 |
| 4 | 借方補助科目 | string | |
| 5 | 借方部門 | string | |
| 6 | 借方取引先 | string | |
| 7 | 借方税区分 | string | MF税区分名（例: `課税仕入 10%`） |
| 8 | 借方インボイス | string | |
| 9 | 借方金額(円) | number | |
| 10 | 借方税額 | number | |
| 11 | 貸方勘定科目 | string | |
| 12 | 貸方補助科目 | string | |
| 13 | 貸方部門 | string | |
| 14 | 貸方取引先 | string | |
| 15 | 貸方税区分 | string | |
| 16 | 貸方インボイス | string | |
| 17 | 貸方金額(円) | number | |
| 18 | 貸方税額 | number | |
| 19 | 摘要 | string | 照合キー（matchKey）の生成元 |
| 20 | 仕訳メモ | string | |
| 21 | タグ | string | |
| 22 | MF仕訳タイプ | string | `簡単入力` / `振替伝票` 等 |
| 23 | 決算整理仕訳 | string | |

### 複合仕訳の例

```csv
取引No,取引日,借方勘定科目,...,借方金額(円),...,貸方勘定科目,...,貸方金額(円),...,摘要,...
1,2026/04/24,外注費,...,200000,...,普通預金,...,220000,...,タナカタロウ,...
1,2026/04/24,仮払消費税,...,20000,...,,...,,...,,...,...
```

→ **取引No=1でグループ化** → entries[]に展開:
- debit_entries: [{account: '外注費', amount: 200000}, {account: '仮払消費税', amount: 20000}]
- credit_entries: [{account: '普通預金', amount: 220000}]

---

## 4. ConfirmedJournal型設計（JournalPhase5Mock互換）

> UIが `debit_entries[0].account` / `credit_entries[0].tax_category_id` でアクセスするため、
> JournalPhase5Mockと互換性のあるentries[]構造を採用する。

### 4-a. ConfirmedJournal型

> **命名規則: snake_case統一**（DL-054）。JournalPhase5Mock/JournalEntryLine/Vendorと同じ。UIで直接使用可能。

```typescript
/** 確定済み仕訳（過去仕訳照合・UI表示用） */
export interface ConfirmedJournal {
  /** 仕訳ID（UUID） */
  id: string
  /** 顧問先ID */
  client_id: string
  /** 取引日（YYYY-MM-DD） */
  voucher_date: string
  /** 摘要（MF CSV 19列目） */
  description: string
  /** 照合キー（normalizeVendorName(摘要) の出力） */
  match_key: string
  /** 取引先ID（vendors_global/client の vendor_id。照合成功時に付与） */
  vendor_id: string | null
  /** 取引先名（MF CSV 借方取引先 or 貸方取引先。表示用） */
  vendor_name: string | null
  /** 入出金方向（借方科目から推定） */
  direction: 'expense' | 'income' | 'transfer'

  /** 借方仕訳行（複合仕訳対応: N行） */
  debit_entries: ConfirmedJournalEntry[]
  /** 貸方仕訳行（複合仕訳対応: N行） */
  credit_entries: ConfirmedJournalEntry[]

  /** データソース */
  source: 'mf_import' | 'system'
  /** MF仕訳タイプ（簡単入力 / 振替伝票 等） */
  mf_journal_type: string | null
  /** 決算整理仕訳フラグ */
  is_closing_entry: boolean
  /** 仕訳メモ（MF CSV 20列目） */
  memo: string | null
  /** タグ（MF CSV 21列目） */
  tags: string | null

  /** インポートバッチID（どのCSVインポートで入ったか） */
  import_batch_id: string
  /** インポート日時（ISO 8601） */
  imported_at: string
  /** MF取引No（CSVの元行番号。重複排除に使用） */
  mf_transaction_no: number | null
}
```

### 4-b. ConfirmedJournalEntry型

```typescript
/** 確定済み仕訳の1行（借方 or 貸方） */
export interface ConfirmedJournalEntry {
  /** 行ID（UUID） */
  id: string
  /** 勘定科目（MF科目名） */
  account: string
  /** 補助科目 */
  sub_account: string | null
  /** 部門 */
  department: string | null
  /** 取引先 */
  vendor_name: string | null
  /** 税区分（MF税区分名） */
  tax_category_id: string | null
  /** インボイス */
  invoice: string | null
  /** 金額（円） */
  amount: number
  /** 税額（円） */
  tax_amount: number | null
}
```

### 4-c. JournalPhase5Mockとの互換性マッピング

| UI参照パス | JournalPhase5Mock | ConfirmedJournal | 互換 |
|---|---|---|---|
| `voucher_date` | `voucher_date` | `voucher_date` | ✅ |
| `description` | `description` | `description` | ✅ |
| `debit_entries[0].account` | `debit_entries[].account` | `debit_entries[].account` | ✅ |
| `debit_entries[0].sub_account` | `debit_entries[].sub_account` | `debit_entries[].sub_account` | ✅ |
| `debit_entries[0].tax_category_id` | `debit_entries[].tax_category_id` | `debit_entries[].tax_category_id` | ✅ |
| `credit_entries[0].account` | `credit_entries[].account` | `credit_entries[].account` | ✅ |
| `labels` | `labels` | なし（source_typeから変換） | ❌ 要アダプター |
| `status` | `status` | なし（常にnull扱い） | ❌ 要アダプター |

---

## 5. CSVパース設計

### パースフロー

```
MF CSV → テキスト読み込み（UTF-8）
       → 行分割 → ヘッダー解析（23列確認）
       → 取引Noでグループ化
       → グループ毎にConfirmedJournal生成
          - 1行目: voucher_date, description, memo, tags, mf_journal_type, direction推定
          - 全行: debit_entries[], credit_entries[] に展開
          - match_key: normalizeVendorName(description) で生成
          - vendor_id: vendors_global照合（任意。パース時 or 後続処理で）
       → API投入（POST /api/confirmed-journals/import）
       → JSON永続化
```

### 重複排除

同一CSVの再投入を防ぐため、`clientId + mfTransactionNo + voucherDate` の組み合わせでUNIQUE制約。

---

## 6. 実装状況

### 6-a. 過去仕訳取込画面

| 項目 | 状態 | ファイル |
|------|------|----------|
| ルーティング | ✅ | `/history-import/:clientId` |
| 画面 | ✅ | MockHistoryImportPage.vue（src/views/history/） |
| CSVアップロード | ✅ | ドラッグ&ドロップ + ファイル選択 |
| MFフォーマット対応 | ✅ | 仕訳帳エクスポートCSV（UTF-8） |
| 取込実行 | ⚠ モック | `setTimeout 1.5秒`のダミー処理。実パース＆保存は未実装 |
| 取込履歴表示 | ✅ | 右カラムにリスト表示 |
| 削除 | ✅ | 確認ダイアログ付き |

> [!WARNING]
> 取込実行（`executeImport`）はL197 `// TODO: 実際のパース＆保存ロジックをここに実装` のまま。CSVパースは行数カウントのみ。

### 6-b. 仕訳一覧での過去仕訳検索

| 項目 | 状態 | ファイル |
|------|------|----------|
| 虫眼鏡アイコン | ✅ | JournalListLevel3Mock.vue（src/components/） |
| 検索モーダル | ✅ → **⑥-3で分離** | PastJournalSearchModal.vue（src/components/）に分離済み。詳細は§11参照 |
| ドラッグ移動 | ✅ | `useDraggable` composable使用 |
| 検索条件 | ✅ | 取引先・日付範囲・金額（一致/以上/以下）・借方科目・貸方科目 |
| 2タブ切替 | ✅ | 「スグスル仕訳」/「会計ソフト」（⑥-2でリネーム済み） |
| ページネーション | ✅ | 50件/ページ |
| 「スグスル仕訳」タブ | ✅ | `journals`（JournalPhase5Mock[]）から検索。旧`localJournals` |
| 「会計ソフト」タブ | ✅ | confirmedJournals（ConfirmedJournal[]）から検索。API `/api/confirmed-journals/{clientId}` 経由 |

### 6-c. `hasPastJournal` 判定

```typescript
// 先頭25件のみ過去仕訳ありと判定（モック）
function hasPastJournal(journal: JournalPhase5Mock): boolean {
  return journals.value.findIndex((j) => j.journalId === journal.journalId) < 25;
}
```

> [!NOTE]
> 本番では `confirmed_journals` に同一取引先（vendorId or matchKey）の仕訳が存在するかで判定すべき。

### 6-d. ヒントモーダル「過去の類似仕訳」

```
L2060-2068: 「🚧 工事中 — DB接続後に有効化予定」
```

ConfirmedJournal実装後にここを接続する。

---

## 7. Supabaseテーブル設計（将来）

### confirmed_journals テーブル

| カラム | 型 | 備考 |
|--------|------|------|
| `id` | UUID | PK |
| `client_id` | TEXT | FK → clients |
| `voucher_date` | DATE | 取引日 |
| `description` | TEXT | 摘要 |
| `match_key` | TEXT | 照合キー（normalizeVendorName出力） |
| `vendor_id` | TEXT | FK → vendors（nullable） |
| `vendor_name` | TEXT | 取引先名 |
| `direction` | TEXT | expense / income / transfer |
| `source` | TEXT | `'mf_import'` / `'system'` |
| `mf_journal_type` | TEXT | MF仕訳タイプ |
| `is_closing_entry` | BOOLEAN | 決算整理仕訳 |
| `memo` | TEXT | 仕訳メモ |
| `tags` | TEXT | タグ |
| `import_batch_id` | UUID | FK → import_batches |
| `imported_at` | TIMESTAMPTZ | 取込日時 |
| `mf_transaction_no` | INTEGER | MF取引No |

### confirmed_journal_entries テーブル

| カラム | 型 | 備考 |
|--------|------|------|
| `id` | UUID | PK |
| `journal_id` | UUID | FK → confirmed_journals |
| `side` | TEXT | `'debit'` / `'credit'` |
| `account` | TEXT | 勘定科目名 |
| `sub_account` | TEXT | 補助科目 |
| `department` | TEXT | 部門 |
| `vendor_name` | TEXT | 取引先 |
| `tax_category` | TEXT | 税区分名 |
| `invoice` | TEXT | インボイス |
| `amount` | INTEGER | 金額（円） |
| `tax_amount` | INTEGER | 税額（円） |
| `display_order` | INTEGER | 表示順 |

> **UNIQUE制約**: `confirmed_journals(client_id, mf_transaction_no, voucher_date)` で重複排除。

---

## 8. 未実装・課題

| # | 課題 | 優先度 | 関連タスク | 状態 |
|---|------|--------|-----------|------|
| 1 | ConfirmedJournal型定義（T-03） | 🔴 高 | T-03 | ✅ 実装済み（src/types/confirmed_journal.type.ts） |
| 2 | CSVパーサー実装（取引Noグループ化→entries[]展開） | 🔴 高 | T-03 | ✅ 実装済み |
| 3 | confirmedJournalStore.ts（JSON永続化） | 🔴 高 | Phase 1 | ✅ 実装済み |
| 4 | confirmedJournalRoutes.ts（API） | 🔴 高 | Phase 1 | ✅ 実装済み |
| 5 | MockHistoryImportPage.vue executeImport()実装 | 🔴 高 | Phase 1 | ✅ 実装済み |
| 6 | 「会計ソフト」タブのデータ接続 | 🟡 中 | Phase 2 | ✅ confirmedJournals + API経由で接続済み |
| 7 | `hasPastJournal` の実データ判定への切替 | 🟡 中 | Phase 2 | 未着手（先頭25件モック判定のまま） |
| 8 | ヒントモーダル「過去の類似仕訳」接続 | 🟡 中 | Phase 2 | 未着手（🚧工事中のまま） |
| 9 | accountDetermination.ts Step 2 過去仕訳照合接続 | 🟡 中 | Phase 2 | 未着手 |
| 10 | camelCase/snake_case互換アダプター | 🟡 中 | Phase 2 | 未着手 |
| 11 | 複数期間CSVの重複排除 | 🟢 低 | データ品質 | 未着手 |
| 12 | 過去仕訳からの科目コピー機能（モーダル→仕訳行に反映） | 🟢 低 | UI改善 | 未着手 |

---

## 9. ⑥-1 `_isPastJournal`廃止→source判定移行 ✅ 完了（2026-06-20）

> **最終更新**: 2026-06-20
> **元セッション**: d3cec2e6 component_analysis.md より転記

### 概要

型定義に存在しない非型安全フラグ`_isPastJournal`を廃止し、
APIから既に返されている`source`フィールドで判定する`isImportedJournal()`ヘルパに統一。

### 変更ファイル

| ファイル | 変更内容 |
|---|---|
| src/types/journal_phase5_mock.type.ts | `source?: 'mf_import' \| 'system'` フィールド追加 |
| src/types/journal-list-row.ts | `isImportedJournal()` ヘルパ関数追加 |
| src/components/JournalListLevel3Mock.vue | 43箇所の`_isPastJournal`→`isImportedJournal()`置換 + import追加 |

### isImportedJournalヘルパ

```typescript
// journal-list-row.ts
export function isImportedJournal(journal: JournalListRow | JournalPhase5Mock): boolean {
  return 'source' in journal && (journal.source === 'mf_import' || journal.source === 'system')
}
```

> [!NOTE]
> `isPastJournal()` ではなく `isImportedJournal()` を採用。
> 「過去仕訳」というUI概念から脱却し、`source`に寄せるため。

### 置換箇所（43箇所）

**テンプレート: 28箇所**

| 種別 | 箇所数 | 置換パターン |
|---|---|---|
| v-if ガード（`rowIndex === 0 && !...`） | 15 | `!journal._isPastJournal` → `!isImportedJournal(journal)` |
| 条件分岐（`... && journal.imported_at`等） | 3 | `journal._isPastJournal` → `isImportedJournal(journal)` |
| CSSクラス条件 | 5 | `!journal._isPastJournal && journal.status !== 'exported'` → `!isImportedJournal(journal) && ...` |
| dblclickガード | 5 | `!journal._isPastJournal &&` → `!isImportedJournal(journal) &&` |

**スクリプト: 15箇所**

| 種別 | 箇所数 | 対応 |
|---|---|---|
| `(j as any)._isPastJournal` continue | 4 | `isImportedJournal(j)` に置換。`as any`キャスト削除 |
| `.filter((j: any) => !j._isPastJournal)` | 4 | `.filter(j => !isImportedJournal(j))` に置換 |
| ガード（assertEditableJournal等） | 4 | `isImportedJournal(journal)` に置換 |
| normalizeJournalForUI | 3 | `_isPastJournal: true/false`削除、コメント更新 |

### normalizeJournalForUIの変更

```typescript
// Before
if (row.source === 'mf_import' || row.source === 'system') {
  return { ...row, _isPastJournal: true, labels: [], status: null, ... }
}
return { ...row, _isPastJournal: false }

// After
if (row.source === 'mf_import' || row.source === 'system') {
  return { ...row, /* ⑥-1: _isPastJournal廃止。sourceはrow自体に既存 */ labels: [], status: null, ... }
}
return { ...row }  // ⑥-1: _isPastJournal廃止。通常仕訳はsource未設定
```

### 検証結果

| テスト | 結果 |
|---|---|
| `vue-tsc --noEmit` | ✅ エラーなし |
| `vite build` | ✅ 466モジュール変換成功 |
| ブラウザ表示（取込仕訳を表示ON） | ✅ 367件正常表示 |
| 取込仕訳の編集不可 | ✅ isImportedJournal()でガード |

### 副次修正

- **divタグ不整合修正**: 6c79c24で混入した`</div>`欠落を修正（`vite build`の`Element is missing end tag`解消）
- **未使用import削除**: `SIDE_DEBIT`, `SIDE_CREDIT`, `LABEL_UNSET`（IDE警告3件解消）

---

## 10. ⑥-2 `showPastCsv`→`showImported`リネーム ✅ 完了（2026-06-20）

### 対象（11箇所、4ファイル → 残存ゼロ確認済み）

| ファイル | 箇所数 | 内容 |
|---|---|---|
| JournalListLevel3Mock.vue | 4 | テンプレートv-model、ref定義、APIリクエスト、watch |
| journalListService.ts | 3 | JournalListQuery型、コメント、if条件 |
| journalRoutes.ts | 4 | searchParams、POSTボディ型、body参照 |

### 検証結果

| テスト | 結果 |
|---|---|
| `vue-tsc --noEmit` | ✅ エラーなし |
| ブラウザ: チェックON → 367件表示 | ✅ |
| ブラウザ: チェックOFF → 1件に戻る | ✅ |
| 取込仕訳行ダブルクリック → 編集不可 | ✅ |

### 副次修正

- journalListService.ts: 未使用関数3個削除（`getRowId`/`getRowStatus`/`getRowDeletedAt`）
- journalListService.ts L386: `journal.labels.includes()` → `getRowLabels(journal).includes()` 型エラー修正

---

## 11. ⑥-3 PastJournalSearchModal分離 ✅ 完了（2026-06-20）

### 概要

過去仕訳検索モーダル（テンプレート314行+スクリプト~250行）を
PastJournalSearchModal.vue（src/components/PastJournalSearchModal.vue）に分離。
②〜⑤と同じパターン（Teleport済みモーダルの子コンポーネント化）。

### 移動対象テンプレート: L1738-L2051（314行）

`<Teleport to="body">` 内の過去仕訳検索モーダル全体。

| 行範囲 | 内容 |
|---|---|
| L1738-1739 | コメント + `<Teleport to="body">` |
| L1740-1764 | モーダル外枠 + ヘッダー（ドラッグハンドル、閉じるボタン） |
| L1766-1858 | 検索条件フォーム（摘要、日付From/To、金額条件、借方/貸方科目、絞り込みボタン） |
| L1860-1895 | タブ切替（スグスル仕訳 / 会計ソフト） |
| L1896-1916 | 件数表示（会計ソフトタブ用ローディング・件数） |
| L1917-1944 | 出力ステータスフィルタ（未出力/出力済みボタン） |
| L1945-1997 | 結果テーブル（v-for `paginatedPastJournals`、日付/摘要/借方科目/金額/貸方科目/金額列） |
| L1998-2037 | ページネーション |
| L2038-2049 | リサイズハンドル |
| L2050-2051 | `</div>` + `</Teleport>` |

### 移動対象スクリプト: L4320-L4624（305行）

| 行範囲 | 名前 | 内容 | 移動先 |
|---|---|---|---|
| L4321-4326 | `pastJournalModalRef` + `useDraggable` | モーダルDOM参照 + ドラッグ | **子** |
| L4397 | `showPastJournalModal` | モーダル表示ref | **親に残す**（テーブル行L609で使用） |
| L4398 | `pastJournalTab` | タブ切替ref | **子** |
| L4399-4407 | `pastJournalSearch` | 検索条件ref（vendor/dateFrom/dateTo/amountCondition/amount/debitAccount/creditAccount） | **子** |
| L4409 | `isPastJournalModalPinned` | ピン留めref | **親に残す**（`hidePastJournalSearchModal`内で参照） |
| L4410 | `outputFilter` | 出力ステータスフィルタref | **子** |
| L4411 | `pastJournalPage` | ページ番号ref | **子** |
| L4412 | `PAST_JOURNAL_PAGE_SIZE` | 定数=50 | **子** |
| L4415-4417 | `confirmedJournals`, `isConfirmedLoading`, `confirmedLoaded` | 会計ソフトデータref群 | **親に残す**（propsで渡す） |
| L4419-4435 | `fetchConfirmedJournals()` | API取得（`/api/confirmed-journals/{clientId}`） | **親に残す**（`showPastJournalSearchModal()`内で呼出） |
| L4437-4441 | `showPastJournalSearchModal()` | モーダル表示 + fetchConfirmedJournals() | **親に残す**（テーブル行L609の@mouseenter） |
| L4443-4447 | `hidePastJournalSearchModal()` | ピン留め時は閉じない | **親に残す**（テーブル行L610の@mouseleave） |
| L4449-4454 | `togglePastJournalSearchModalPin()` | ピン留めトグル | **親に残す**（テーブル行L611の@click） |
| L4456-4459 | `closePastJournalModal()` | 強制閉じ（ピン解除含む） | **親に残す**（モーダル内閉じるボタン→emit経由） |
| L4461-4600 | `filteredPastJournals` computed（**140行**） | journals/confirmedJournalsの検索・フィルタ・タブ切替 | **子** |
| L4602-4604 | `paginatedPastJournals` computed | ページネーション | **子** |
| L4607-4609 | `totalPages` computed | ページ数計算 | **子** |
| L4611-4618 | `toggleOutputFilter()` | 出力ステータストグル | **子** |
| L4620-4624 | `goToPage()` | ページ遷移 | **子** |

### テーブル行からの呼び出し（L596-619）

テンプレートL596-619の「過去仕訳」列:

```vue
<template v-else-if="col.key === 'pastJournal'">
  <div v-if="rowIndex === 0 && !isImportedJournal(journal)" ...>
    <i
      v-if="hasPastJournal(journal)"           ← L606: 親に残す
      @mouseenter="showPastJournalSearchModal()"  ← L609: 親に残す
      @mouseleave="hidePastJournalSearchModal()"  ← L610: 親に残す
      @click="togglePastJournalSearchModalPin()"  ← L611: 親に残す
    ></i>
  </div>
</template>
```

この列は**親テンプレートに残る**。子コンポーネントのprops/emitとは独立。

### hasPastJournal（L5016-5018、親に残す）

```typescript
function hasPastJournal(journal: JournalPhase5Mock): boolean {
  return journals.value.findIndex((j) => j.journalId === journal.journalId) < 25;
}
```

journals参照あり。テーブル行L606で使用。親に残す。

### 子コンポーネントのimport要件

| import | 用途 |
|---|---|
| `useDraggable` from `@/composables/useDraggable` | モーダルドラッグ |
| `modalDrag` from `@/utils/modalDrag` | ドラッグフィルタ（L1751で使用） |
| `UI_MSG` from `@/constants/uiMessages` | L1775 `サンプル建物名`、L1815 `金額入力` |
| `JournalLabelMock` from `@/types/journal_phase5_mock.type` | L4587 `labels: [] as JournalLabelMock[]` |
| `JournalEntryLine` from `@/types/journal_phase5_mock.type` | reduce/some内の型付け |
| `ConfirmedJournal` from `@/types/confirmed_journal.type` | props型 |
| `JournalPhase5Mock` from `@/types/journal_phase5_mock.type` | props型 |
| `NULL_DISPLAY_UNKNOWN` from `@/shared/field-nullable-spec` | formatDate内のフォールバック |
| `AMOUNT_CONDITION_OPTIONS`, `PLACEHOLDER_SELECT` from `@/constants/vendorOptions` | 金額条件/プレースホルダ |
| `useAccountMaster` from `@/features/account-management/composables/useAccountMaster` | accountOptions生成 |
| `toMfCsvDate` from `@/utils/mf-csv-date` | formatDate内の日付変換 |

### resolveAccountName依存分析

`resolveAccountName()`は:
- **スクリプト**: filteredPastJournals computed内、借方/貸方科目フィルタ
- **テンプレート**: 結果テーブルの借方/貸方科目表示

実装:
```typescript
function resolveAccountName(id: string | null | undefined): string {
  if (!id) return "";
  const allAccts = clientSettings.accounts.value;
  const account = allAccts.find((a) => a.accountId === id);
  return account ? account.name : id;
}
```

`clientSettings.accounts`はcomposable `useAccountSettings`から取得。

> [!IMPORTANT]
> **実装時の方式変更**: 当初計画では子で`useAccountSettings`を直接importする予定だったが、
> composable初期化に`clientId`が必要なため、`resolveAccountName`と`resolveTaxCategoryName`は
> **propsで関数として渡す方式**に変更した。

### 変更ファイル

| ファイル | 変更内容 |
|---|---|
| src/components/PastJournalSearchModal.vue | **[NEW]** テンプレート+スクリプト 570行 |
| src/components/JournalListLevel3Mock.vue | テンプレート314行→15行置換、スクリプト不要ref/computed/関数削除、import追加 |
| index.html | `<body>`内`<style>`を`public/loader.css`に外部化（vite buildエラー修正） |
| public/loader.css | **[NEW]** ローディング画面CSS |

### 子コンポーネント設計

**props**（実装結果 — 計画から変更あり）:
```typescript
defineProps<{
  visible: boolean                        // showPastJournalModal
  pinned: boolean                         // isPastJournalModalPinned
  journals: JournalPhase5Mock[]           // スグスル仕訳タブ用（親のjournals）
  confirmedJournals: ConfirmedJournal[]   // 会計ソフトタブ用
  isConfirmedLoading: boolean             // ローディング状態
  resolveAccountName: (id: string | null | undefined) => string   // ← 計画変更: propsで渡す
  resolveTaxCategoryName: (id: string | null | undefined) => string // ← 計画変更: propsで渡す
}>()
```

**emits**: `close` / `toggle-pin` / `fetch-confirmed`

> [!NOTE]
> `mouseenter`/`mouseleave`はVueのネイティブイベントフォワーディングで親に伝播。明示的emit不要。
> `fetch-confirmed`は計画にはなかったが、タブ切替時の`fetchConfirmedJournals()`呼出のために追加。

### 親テンプレートの置換後

```vue
<!-- 過去仕訳検索モーダル（子コンポーネントに分離） -->
<PastJournalSearchModal
  :visible="showPastJournalModal"
  :pinned="isPastJournalModalPinned"
  :journals="journals"
  :confirmedJournals="confirmedJournals"
  :isConfirmedLoading="isConfirmedLoading"
  :resolveAccountName="resolveAccountName"
  :resolveTaxCategoryName="resolveTaxCategoryName"
  @close="closePastJournalModal"
  @toggle-pin="togglePastJournalSearchModalPin"
  @fetch-confirmed="fetchConfirmedJournals"
  @mouseenter="showPastJournalSearchModal()"
  @mouseleave="hidePastJournalSearchModal()"
/>
```

### 親から削除した要素

1. テンプレートL1738-L2051（314行）→ 上記15行に置換
2. スクリプトL4321-4326（`pastJournalModalRef` + `useDraggable`）削除
3. スクリプトref群: `pastJournalTab`, `pastJournalSearch`, `outputFilter`, `pastJournalPage`, `PAST_JOURNAL_PAGE_SIZE` 削除
4. スクリプトL4461-4624（`filteredPastJournals`〜`goToPage`）削除
5. import削除: `useDraggable`, `modalDrag`, `JournalLabelMock`, `AMOUNT_CONDITION_OPTIONS`, `PLACEHOLDER_SELECT`, `useAccountMaster`, `accountOptions`, `SelectOption`

### 親に残した要素

`showPastJournalModal`, `isPastJournalModalPinned`, `showPastJournalSearchModal()`, `hidePastJournalSearchModal()`, `togglePastJournalSearchModalPin()`, `closePastJournalModal()`, `confirmedJournals`関連（ref3個+fetch関数）, `hasPastJournal`

### 品質監査結果

| 項目 | 結果 |
|---|---|
| `vue-tsc --noEmit` | ✅ エラー0件 |
| `npx eslint` | ✅ エラー0件（any→JournalEntryLine修正済み） |
| `npx vite build` | ✅ 成功 |
| ピン留めUI | ✅ ピンアイコン+toggle-pin emit追加 |
| `NULL_DISPLAY_UNKNOWN` | ✅ `@/shared/field-nullable-spec`からimport |

### 副次修正

- **index.html html-proxyエラー修正**: `<body>`内の`<style>`を`public/loader.css`に外部化
- **未使用import削除**: `useDraggable`, `modalDrag`, `JournalLabelMock`, `AMOUNT_CONDITION_OPTIONS`, `PLACEHOLDER_SELECT`, `useAccountMaster`, `accountOptions`, `SelectOption`

### 計画と実装の差分

| 項目 | 計画 | 実装 |
|---|---|---|
| `resolveAccountName` | 子で`useAccountSettings`直接import | propsで関数渡し（composable初期化にclientId必要のため） |
| `resolveTaxCategoryName` | （同上） | propsで関数渡し |
| `fetch-confirmed` emit | なし | 追加（タブ切替時のfetchConfirmedJournals()呼出用） |
| ピンアイコン | なし（計画漏れ） | 追加（pinnedの視覚フィードバック） |
| 削減行数 | ~550行 | ~485行 |

### 行数推移

```
⑥-2完了後:   5375行
⑥-3完了後:   ~4890行（-485行）
             --------
             初期比 -1290行（-20.9%）
```
