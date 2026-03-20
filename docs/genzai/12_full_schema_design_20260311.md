# 全テーブル設計書 v1.0

**作成日**: 2026-03-11
**目的**: 今回の設計議論で決定した全事項を1ファイルにまとめる
**参照元**: journal_v2_20260214.md, entity_id_definition.md, migration.sql, GPT提案, 当日チャット議論

---

## §1 データ階層構造（確定）

```
Client（顧問先）
  ↓ 1:N
Document（証票）
  ↓ 1:N
DocumentLine（証票行）
  ↓ 1:N
Journal（仕訳）
  ↓ 1:N
JournalEntry（仕訳明細）
```

### 関係の例

**レシート1枚の場合**:
```
Document（レシート画像）→ DocumentLine（1行のみ）→ Journal（1仕訳）→ JournalEntry（借方1行+貸方1行）
```

**通帳PDFの場合**:
```
Document（通帳PDF）→ DocumentLine（10行）→ 各行にJournal → 各仕訳にJournalEntry
```

---

## §2 ID形式（確定）

### 全エンティティ共通ルール

- **接頭辞+連番**で統一
- モック=本番=同じ形式（使い分けない）
- ゼロ埋め桁数: エンティティにより異なる（下表参照）

| エンティティ | 接頭辞 | 桁数 | 例 |
|------------|--------|:----:|---|
| 顧問先（Client） | `{3コード}-` | 5桁 | `ABC-00001` |
| スタッフ（Staff） | `staff-` | 4桁 | `staff-0001` |
| 証票（Document） | `doc-` | 8桁 | `doc-00000001` |
| 証票行（DocumentLine） | `{親doc ID}-line-` | 3桁 | `doc-00000001-line-003` |
| 仕訳（Journal） | `jrn-` | 8桁 | `jrn-00000001` |
| 仕訳明細（JournalEntry） | `{親jrn ID}-` | d/c+行番号 | `jrn-00000001-d1`, `jrn-00000001-c2` |
| 出力バッチ（ExportBatch） | `batch-` | 日付+連番 | `batch-20260311-01` |
| 取引先（Vendor） | `vendor-` | 8桁 | `vendor-00000001` |

### 仕訳明細IDの規則

```
jrn-00000001-d1   ← 借方（debit）1行目
jrn-00000001-d2   ← 借方2行目
jrn-00000001-c1   ← 貸方（credit）1行目
jrn-00000001-c2   ← 貸方2行目
```

---

## §3 仕訳ステータス（確定）

```
null → exported
```

| status（ステータス） | 意味 | 編集可否 |
|---------------------|------|:--------:|
| `null` | 未出力（デフォルト） | ✅ 可能 |
| `exported` | 出力済み（CSV出力完了） | ❌ 不可 |

- 2値のみ。Streamed準拠
- AI処理段階（draft, ai_generated等）は仕訳ステータスではなく処理ログで管理

---

## §4 出力ファイル名規則（確定）

```
{client_id}_マネーフォワード_{yyyyMMdd}.csv
```

- 同日2回目以降: `{client_id}_マネーフォワード_{yyyyMMdd}_2.csv`, `_3.csv`...
- 例: `ABC-00001_マネーフォワード_20260311.csv`

---

## §5 テーブル定義

### 5.1 journals（仕訳）— 既存+追加

既存カラム（migration.sql準拠）に以下を追加:

| カラム | 型 | 追加/既存 | 説明 |
|--------|---|:--------:|------|
| `id` | VARCHAR(20) PK | 既存→形式変更 | `jrn-00000001` |
| `client_id` | VARCHAR(20) | 既存 | 顧問先ID |
| `document_id` | VARCHAR(20) | 既存（名称変更: receipt_id→document_id） | 証票ID |
| `line_id` | VARCHAR(40) | **追加** | 証票行ID（冗長だがクエリ高速化用） |
| `display_order` | INTEGER | 既存 | 表示順 |
| `voucher_date` | DATE | 既存（名称変更: transaction_date→voucher_date） | 伝票日（証憑に記載された日付=fact。税務会計上の取引日としての正しさはシステムは保証しない） |
| `description` | TEXT | 既存 | 摘要 |
| `status` | journal_status | 既存 | null / exported |
| `status_updated_at` | TIMESTAMP | 既存 | ステータス更新日時 |
| `status_updated_by` | VARCHAR(20) | 既存 | ステータス更新者 |
| `is_read` | BOOLEAN | 既存 | 未読/既読 |
| `read_at` | TIMESTAMP | 既存 | 既読日時 |
| `labels` | TEXT[] | 既存 | ラベル配列（22種） |
| `is_credit_card_payment` | BOOLEAN | 既存 | クレカ払い判定 |
| `rule_id` | VARCHAR(20) | 既存 | ルールID |
| `rule_confidence` | NUMERIC(3,2) | 既存 | ルール信頼度 |
| `invoice_status` | VARCHAR(20) | 既存 | 適格/不適格 |
| `invoice_number` | VARCHAR(14) | 既存 | インボイス番号 |
| `memo` | TEXT | 既存 | メモ内容 |
| `memo_author` | VARCHAR(100) | 既存 | メモ作成者 |
| `memo_target` | VARCHAR(100) | 既存 | メモ宛先 |
| `memo_created_at` | TIMESTAMP | 既存 | メモ作成日時 |
| `exported_at` | TIMESTAMP | 既存 | 出力日時 |
| `exported_by` | VARCHAR(100) | 既存 | 出力者 |
| `export_exclude` | BOOLEAN | 既存 | 出力対象外 |
| `export_exclude_reason` | VARCHAR(200) | 既存 | 出力対象外理由 |
| `deleted_at` | TIMESTAMP | 既存 | 削除日時（ゴミ箱） |
| `deleted_by` | VARCHAR(100) | 既存 | 削除者 |
| `created_at` | TIMESTAMP | 既存 | 作成日時 |
| `updated_at` | TIMESTAMP | 既存 | 更新日時 |
| `created_by` | VARCHAR(20) | **追加** | 作成者（スタッフID or 'AI'） |
| `updated_by` | VARCHAR(20) | **追加** | 更新者 |
| `ai_completed_at` | TIMESTAMP | **追加** | AI仕訳生成完了日時 |
| `prediction_method` | VARCHAR(50) | **追加** | 推定方法（keyword, alias, ai等） |
| `prediction_score` | NUMERIC(5,4) | **追加** | 推定信頼度 |
| `model_version` | VARCHAR(50) | **追加** | 使用モデルバージョン |

---

### 5.2 journal_entries（仕訳明細）— 既存

| カラム | 型 | 説明 |
|--------|---|------|
| `id` | VARCHAR(30) PK | `jrn-00000001-d1` |
| `journal_id` | VARCHAR(20) FK | 親仕訳ID |
| `entry_type` | VARCHAR(10) | `debit`（借方）/ `credit`（貸方） |
| `line_number` | INTEGER | 行番号（1から開始） |
| `account` | VARCHAR(100) | 勘定科目 |
| `sub_account` | VARCHAR(100) | 補助科目 |
| `amount` | NUMERIC(15,2) | 金額 |
| `tax_category_id` | VARCHAR(50) | 税区分（概念ID） |
| `account_on_document` | BOOLEAN | 勘定科目の項目存在フラグ |
| `amount_on_document` | BOOLEAN | 金額の項目存在フラグ |
| `created_at` | TIMESTAMP | 作成日時 |

---

### 5.3 documents（証票）— **新規**

| カラム | 型 | 説明 |
|--------|---|------|
| `id` | VARCHAR(20) PK | `doc-00000001` |
| `client_id` | VARCHAR(20) FK | 顧問先ID |
| `source_type` | VARCHAR(30) | 証票種類（receipt, invoice, bank_statement等） |
| `file_path` | TEXT | ファイルパス |
| `file_hash` | VARCHAR(64) | ファイルSHA256ハッシュ（重複検出用） |
| `ocr_text` | TEXT | OCR生テキスト |
| `document_date` | DATE | 証票に記載されている日付 |
| `uploaded_at` | TIMESTAMP | アップロード日時 |
| `ocr_completed_at` | TIMESTAMP | OCR完了日時 |
| `ocr_engine` | VARCHAR(50) | OCRエンジン名（google_vision等） |
| `ocr_version` | VARCHAR(20) | OCRバージョン |
| `ocr_confidence` | NUMERIC(5,4) | OCR信頼度 |
| `external_id` | VARCHAR(100) | 外部ID（STREAMED連携用） |
| `external_source` | VARCHAR(50) | 外部ソース名 |
| `processing_time_ms` | INTEGER | 処理時間（ミリ秒） |
| `created_at` | TIMESTAMP | 作成日時 |
| `created_by` | VARCHAR(20) | 作成者 |

---

### 5.4 document_lines（証票行）— **新規**

| カラム | 型 | 説明 |
|--------|---|------|
| `id` | VARCHAR(40) PK | `doc-00000001-line-003` |
| `document_id` | VARCHAR(20) FK | 親証票ID |
| `line_index` | INTEGER | 行番号（1から開始） |
| `raw_text` | TEXT | OCR生テキスト（この行のみ） |
| `normalized_text` | TEXT | 正規化テキスト |
| `keywords` | TEXT[] | 抽出キーワード配列 |
| `date` | DATE | この行の日付（通帳の各行の取引日等） |
| `amount` | NUMERIC(15,2) | この行の金額 |
| `description` | TEXT | この行の摘要 |
| `date_on_document` | BOOLEAN | 日付の項目存在フラグ |
| `amount_on_document` | BOOLEAN | 金額の項目存在フラグ |
| `created_at` | TIMESTAMP | 作成日時 |

---

### 5.5 export_batches（出力バッチ）— 既存（ID形式変更）

| カラム | 型 | 説明 |
|--------|---|------|
| `id` | VARCHAR(20) PK | `batch-20260311-01` |
| `client_id` | VARCHAR(20) FK | 顧問先ID |
| `exported_at` | TIMESTAMP | 出力日時 |
| `exported_by` | VARCHAR(20) FK | 出力者 |
| `journal_count` | INTEGER | 仕訳件数 |
| `filename` | TEXT | ファイル名 |
| `created_at` | TIMESTAMP | 作成日時 |

---

### 5.6 journal_exports（仕訳出力紐付け）— 既存

| カラム | 型 | 説明 |
|--------|---|------|
| `id` | VARCHAR(20) PK | 連番 |
| `journal_id` | VARCHAR(20) FK | 仕訳ID |
| `export_batch_id` | VARCHAR(20) FK | 出力バッチID |
| `exported_at` | TIMESTAMP | 出力日時 |

---

### 5.7 vendors（取引先マスタ）— **新規**

| カラム | 型 | 説明 |
|--------|---|------|
| `id` | VARCHAR(20) PK | `vendor-00000001` |
| `name` | VARCHAR(200) | 正式名称 |
| `normalized_name` | VARCHAR(200) | 正規化名称 |
| `invoice_number` | VARCHAR(14) | インボイス番号（T+13桁） |
| `created_at` | TIMESTAMP | 作成日時 |
| `updated_at` | TIMESTAMP | 更新日時 |

---

### 5.8 vendor_aliases（取引先別名）— **新規**

| カラム | 型 | 説明 |
|--------|---|------|
| `id` | SERIAL PK | 連番 |
| `vendor_id` | VARCHAR(20) FK | 取引先ID |
| `alias` | VARCHAR(200) | 別名（AMZN, amazon marketplace等） |
| `source` | VARCHAR(30) | 登録元（manual, ocr, ai） |
| `created_at` | TIMESTAMP | 作成日時 |

---

### 5.9 vendor_keywords（取引先キーワード）— **新規**

| カラム | 型 | 説明 |
|--------|---|------|
| `id` | SERIAL PK | 連番 |
| `vendor_id` | VARCHAR(20) FK | 取引先ID |
| `keyword` | VARCHAR(100) | キーワード |
| `frequency` | INTEGER | 出現頻度 |
| `approved_by` | VARCHAR(20) | 承認者 |
| `approved_at` | TIMESTAMP | 承認日時 |
| `created_at` | TIMESTAMP | 作成日時 |

---

### 5.10 decision_logs（判断ログ）— **新規**

| カラム | 型 | 説明 |
|--------|---|------|
| `id` | VARCHAR(20) PK | 連番 |
| `entity_type` | VARCHAR(30) | 対象種別（document, journal等） |
| `entity_id` | VARCHAR(40) | 対象ID |
| `decision_type` | VARCHAR(50) | 判断種別（vendor_detection, account_prediction等） |
| `decision_method` | VARCHAR(50) | 判断方法（keyword, alias, ai等） |
| `decision_score` | NUMERIC(5,4) | 信頼度 |
| `candidate_values` | JSONB | 候補値（{amazon:10, microsoft:2}等） |
| `selected_value` | TEXT | 選択された値 |
| `input_snapshot` | TEXT | 入力テキスト |
| `model_version` | VARCHAR(50) | モデルバージョン |
| `created_at` | TIMESTAMP | 作成日時 |

---

### 5.11 source_snapshots（入力スナップショット）— **新規**

| カラム | 型 | 説明 |
|--------|---|------|
| `id` | VARCHAR(20) PK | 連番 |
| `entity_type` | VARCHAR(30) | 対象種別 |
| `entity_id` | VARCHAR(40) | 対象ID |
| `raw_text` | TEXT | OCR生テキスト |
| `normalized_text` | TEXT | 正規化テキスト |
| `extracted_fields` | JSONB | 抽出されたフィールド |
| `keywords` | TEXT[] | キーワード配列 |
| `created_at` | TIMESTAMP | 作成日時 |

---

### 5.12 ground_truth（正解データ）— **新規**

| カラム | 型 | 説明 |
|--------|---|------|
| `id` | VARCHAR(20) PK | 連番 |
| `entity_type` | VARCHAR(30) | 対象種別（journal等） |
| `entity_id` | VARCHAR(40) | 対象ID |
| `field_name` | VARCHAR(50) | フィールド名（vendor, account等） |
| `predicted_value` | TEXT | AI予測値 |
| `correct_value` | TEXT | スタッフ修正後の正解値 |
| `corrected_by` | VARCHAR(20) | 修正者（スタッフID） |
| `corrected_at` | TIMESTAMP | 修正日時 |
| `prediction_confidence` | NUMERIC(5,4) | 元の推定信頼度 |
| `created_at` | TIMESTAMP | 作成日時 |

---

### 5.13 processing_batches（処理バッチ）— **新規**

| カラム | 型 | 説明 |
|--------|---|------|
| `id` | VARCHAR(30) PK | `batch-20260311-01` |
| `batch_type` | VARCHAR(30) | バッチ種別（OCR, AI_JOURNAL, KEYWORD_LEARNING等） |
| `client_id` | VARCHAR(20) | 顧問先ID |
| `started_at` | TIMESTAMP | 開始日時 |
| `finished_at` | TIMESTAMP | 終了日時 |
| `document_count` | INTEGER | 処理証票数 |
| `status` | VARCHAR(20) | 処理状態（pending, running, completed, failed） |
| `created_at` | TIMESTAMP | 作成日時 |

---

### 5.14 ocr_runs（OCR実行ログ）— **新規**

| カラム | 型 | 説明 |
|--------|---|------|
| `id` | VARCHAR(20) PK | 連番 |
| `document_id` | VARCHAR(20) FK | 証票ID |
| `batch_id` | VARCHAR(30) FK | バッチID |
| `ocr_engine` | VARCHAR(50) | OCRエンジン名 |
| `ocr_version` | VARCHAR(20) | OCRバージョン |
| `processing_time_ms` | INTEGER | 処理時間（ミリ秒） |
| `confidence` | NUMERIC(5,4) | 信頼度 |
| `raw_text_size` | INTEGER | テキストサイズ（バイト） |
| `created_at` | TIMESTAMP | 作成日時 |

---

### 5.15 ai_inference_logs（AI推論ログ）— **新規**

| カラム | 型 | 説明 |
|--------|---|------|
| `id` | VARCHAR(20) PK | 連番 |
| `document_id` | VARCHAR(20) FK | 証票ID |
| `journal_id` | VARCHAR(20) FK | 仕訳ID |
| `model_name` | VARCHAR(50) | モデル名 |
| `model_version` | VARCHAR(50) | モデルバージョン |
| `prompt_hash` | VARCHAR(64) | プロンプトハッシュ |
| `response_time_ms` | INTEGER | 応答時間（ミリ秒） |
| `token_input` | INTEGER | 入力トークン数 |
| `token_output` | INTEGER | 出力トークン数 |
| `confidence` | NUMERIC(5,4) | 信頼度 |
| `created_at` | TIMESTAMP | 作成日時 |

---

### 5.16 ai_usage（AIコスト管理）— **新規**

| カラム | 型 | 説明 |
|--------|---|------|
| `id` | VARCHAR(20) PK | 連番 |
| `model_name` | VARCHAR(50) | モデル名 |
| `tokens_input` | INTEGER | 入力トークン数 |
| `tokens_output` | INTEGER | 出力トークン数 |
| `cost_estimate` | NUMERIC(10,4) | コスト見積もり（円） |
| `created_at` | TIMESTAMP | 作成日時 |

---

### 5.17 staff_work_logs（スタッフ作業ログ）— **新規**

| カラム | 型 | 説明 |
|--------|---|------|
| `id` | VARCHAR(20) PK | 連番 |
| `staff_id` | VARCHAR(20) FK | スタッフID |
| `client_id` | VARCHAR(20) FK | 顧問先ID |
| `document_id` | VARCHAR(20) | 証票ID（任意） |
| `journal_id` | VARCHAR(20) | 仕訳ID（任意） |
| `work_type` | VARCHAR(30) | 作業種別（OCR確認, 仕訳修正, 取引先修正, CSV出力確認） |
| `start_time` | TIMESTAMP | 開始時刻 |
| `end_time` | TIMESTAMP | 終了時刻 |
| `duration_seconds` | INTEGER | 作業時間（秒） |
| `created_at` | TIMESTAMP | 作成日時 |

---

### 5.18 vendor_prediction_logs（取引先推定ログ）— **新規**

| カラム | 型 | 説明 |
|--------|---|------|
| `id` | VARCHAR(20) PK | 連番 |
| `document_id` | VARCHAR(20) FK | 証票ID |
| `line_id` | VARCHAR(40) FK | 証票行ID |
| `vendor_candidate` | VARCHAR(200) | 候補取引先名 |
| `method` | VARCHAR(30) | 推定方法（T_number, phone, alias, keyword, manual） |
| `score` | NUMERIC(5,4) | スコア |
| `selected` | BOOLEAN | この候補が選択されたか |
| `created_at` | TIMESTAMP | 作成日時 |

---

## §6 DDLファイル構成（確定）

**1ファイル統合、セクション区分方式**

```
docs/genzai/02_database_schema/journal/migration.sql（既存ファイルを拡張）
```

セクション構成（参照順序に基づく）:
```sql
-- ============================================================
-- 1. ENUM型定義
-- ============================================================

-- ============================================================
-- 1.5 SEQUENCE定義（接頭辞+連番用、15個）
-- ============================================================

-- ============================================================
-- 2. 証票系（documents, document_lines）← 参照先を先に定義
-- ============================================================

-- ============================================================
-- 3. 仕訳系（journals, journal_entries, export_batches, journal_exports）
-- ============================================================

-- ============================================================
-- 4. 取引先系（vendors, vendor_aliases, vendor_keywords）
-- ============================================================

-- ============================================================
-- 5. AI/OCR/学習系（decision_logs, source_snapshots, ground_truth,
--    processing_batches, ocr_runs, ai_inference_logs, ai_usage,
--    staff_work_logs, vendor_prediction_logs）
-- ============================================================

-- ============================================================
-- 6. インデックス
-- ============================================================

-- ============================================================
-- 7. RLS（Row Level Security）
-- ============================================================

-- ============================================================
-- 8. トリガー
-- ============================================================

-- ============================================================
-- 9. コメント
-- ============================================================
```

理由: 1人開発。全テーブルが1箇所で確認できる方が管理しやすい。

---

## §7 その他決定事項

| # | 項目 | 決定内容 |
|---|------|---------|
| 1 | 仕訳明細構造 | `entry_type`分離方式（既存維持）。UI変換は既存`getCombinedRows()`で対応 |
| 2 | `reviewed_at` | 不要。`read_at`で代用 |
| 3 | 親子関係の`document_id`冗長保持 | `line_id`があれば辿れるが、クエリ高速化のためJournal（仕訳）に`document_id`も直接保持 |
| 4 | Vendor系・AI系テーブル | 今回定義。実データ投入は各機能実装時 |
| 5 | 出力バッチ管理 | `export_batches` + `journal_exports` の2テーブル（既存維持） |
| 6 | 仕訳に追加するカラム | `created_by`, `updated_by`, `line_id`, `ai_completed_at`, `prediction_method`, `prediction_score`, `model_version` |
| 7 | エンコーディング方針（2026-03-12追加） | ソースコードは全てUTF-8。CSVエクスポート（MFクラウド向け）はUTF-8 BOM付き（`\uFEFF`先頭付与）。CSV読み込み（銀行・クレカ明細）はShift-JISの可能性があるため`TextDecoder('shift-jis')`で変換 |
| 8 | MF公式判定（2026-03-20追加） | `isCustom=false`→MF公式（デフォルト科目/税区分）、`isCustom=true`→MF非公式。専用の`isMfOfficial`フラグは不使用 |
| 9 | MFマスタ鮮度維持（2026-03-20追加・保留） | MF API連携はパートナー限定のため❌保留。CSVバリデーションスクリプト（`npm run validate:mf-master`）❌保留。現時点では手動CSV更新が最も実現可能な方法 |
