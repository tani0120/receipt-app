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
| U-3 | **仕訳一覧: 過去仕訳検索モーダル「会計ソフトから取り込んだ過去仕訳」タブ** | [JournalListLevel3Mock.vue L1788](file:///c:/dev/receipt-app/src/mocks/components/JournalListLevel3Mock.vue#L1788)（現在 `return []`） | voucher_date, description, debit_entries[].account/sub_account/tax_category_id, credit_entries同様, labels |
| U-4 | **仕訳一覧: ヒントモーダル「過去の類似仕訳」** | [JournalListLevel3Mock.vue L2060](file:///c:/dev/receipt-app/src/mocks/components/JournalListLevel3Mock.vue#L2060)（現在「🚧工事中」） | 同上 |
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
| 画面 | ✅ | [MockHistoryImportPage.vue](file:///c:/dev/receipt-app/src/mocks/views/MockHistoryImportPage.vue) |
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
| 虫眼鏡アイコン | ✅ | [JournalListLevel3Mock.vue L510-534](file:///c:/dev/receipt-app/src/mocks/components/JournalListLevel3Mock.vue#L510-L534) |
| 検索モーダル | ✅ | [L1640-1910](file:///c:/dev/receipt-app/src/mocks/components/JournalListLevel3Mock.vue#L1640-L1910) |
| ドラッグ移動 | ✅ | `useDraggable` composable使用 |
| 検索条件 | ✅ | 取引先・日付範囲・金額（一致/以上/以下）・借方科目・貸方科目 |
| 2タブ切替 | ✅ | 「システム上の過去仕訳」/「会計ソフトから取り込んだ過去仕訳」 |
| ページネーション | ✅ | 50件/ページ |
| 「システム上」タブ | ⚠ モック | `localJournals`（JournalPhase5Mock）から検索。実データ未接続 |
| **「会計ソフト」タブ** | **❌ 未実装** | **L5049-5051: `return []`** |

### 6-c. `hasPastJournal` 判定

```typescript
// L5497: 先頭25件のみ過去仕訳ありと判定（モック）
function hasPastJournal(journal: JournalPhase5Mock): boolean {
  return localJournals.value.findIndex((j) => j.id === journal.id) < 25;
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

| # | 課題 | 優先度 | 関連タスク |
|---|------|--------|-----------:|
| 1 | ConfirmedJournal型定義（T-03） | 🔴 高 | T-03 |
| 2 | CSVパーサー実装（取引Noグループ化→entries[]展開） | 🔴 高 | T-03 |
| 3 | confirmedJournalStore.ts（JSON永続化） | 🔴 高 | Phase 1 |
| 4 | confirmedJournalRoutes.ts（API） | 🔴 高 | Phase 1 |
| 5 | MockHistoryImportPage.vue executeImport()実装 | 🔴 高 | Phase 1 |
| 6 | 「会計ソフト」タブのデータ接続（`return []` → ConfirmedJournal検索） | 🟡 中 | Phase 2 |
| 7 | `hasPastJournal` の実データ判定への切替 | 🟡 中 | Phase 2 |
| 8 | ヒントモーダル「過去の類似仕訳」接続 | 🟡 中 | Phase 2 |
| 9 | accountDetermination.ts Step 2 過去仕訳照合接続 | 🟡 中 | Phase 2 |
| 10 | camelCase/snake_case互換アダプター | 🟡 中 | Phase 2 |
| 11 | 複数期間CSVの重複排除 | 🟢 低 | データ品質 |
| 12 | 過去仕訳からの科目コピー機能（モーダル→仕訳行に反映） | 🟢 低 | UI改善 |
