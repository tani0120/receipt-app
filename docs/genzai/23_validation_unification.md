# 23: バリデーション統合 + any排除（フェーズA: 現スキーマ維持）

## 概要

バリデーションロジックの散在（receiptService.ts内のif連続）、any型によるAPIレスポンスアクセス、取引先バリデーション未実装、MIME定数の二重定義を一括で解消する。

**重要制約: 現在のPreviewExtractResponse型（types.ts）は一切変更しない。**
スキーマ統一・旧ファイル移植（旧previewExtract_postprocess.ts→新postprocess.ts）は別フェーズ（フェーズB）として分離済み。→ task_unified.md C-9参照

## 設計原則

- **postprocess = 計算**、**validate = 判定**。役割を分ける
- **データ駆動**: 単純なルール → 定数テーブル、複雑なロジック → code
- **型を変えずにロジックだけ集約する**
- バリデーション判定は`validatePreviewExtractResult.ts` 1箇所に統一

---

## 技術的負債一覧（フェーズAで潰す分）

| # | 負債 | 場所 | 危険度 | 内容 |
|---|---|---|---|---|
| D-1 | any型でAPIレスポンスアクセス | receiptService.ts L188-228 | 🔴致命 | `response.json()` → any。型チェックなしで参照 |
| D-2 | 行データの型がany | receiptService.ts L221 | 🔴致命 | `Record<string, unknown>` で行データにアクセス |
| D-3 | ReceiptAnalysisResult型のハードコード | receiptService.ts L7-53 | 🟡高 | types.tsに集約すべき型がファイル内にインライン定義 |
| D-4 | バリデーションのif連続ハードコード | receiptService.ts L230-303 | 🟡高 | データ駆動設計ではなくif連続。ルール追加時に漏れる |
| D-5 | 取引先（issuer_name）バリデーション未実装 | receiptService.ts | 🔴致命 | 日付・金額はチェックしているが取引先はスルー |
| D-6 | supplementary_docの日付・金額バリデーション免除 | receiptService.ts L231 | 🟡高 | multiLineTypesに含まれていて免除されている（間違い） |
| D-7 | 通帳・クレカの行データバリデーション未実装 | receiptService.ts | 🟡高 | 各行のdate/amount/取引先をチェックしていない |
| D-8 | MIME定数の二重定義 | receiptService.ts L112 + MockUploadPage.vue L424 | 🟡高 | 同じMIME条件が2箇所に書かれている |

### フェーズBに先送りした負債（今回は触らない）

| # | 負債 | 理由 |
|---|---|---|
| D-9 | スキーマ分裂（3ファイル） | 旧スキーマ（previewExtract_schema.ts）と新スキーマ（types.ts）は設計思想が違う（7種 vs 12種）。統合は大手術 |
| D-10 | previewExtract_postprocess.tsが本番未接続 | 旧型（GeminiPreviewExtractResponse 29フィールド）に依存。新型に移植するにはスキーマ統一が前提 |
| D-11 | previewExtract_test.tsがGemini直呼び出し | テスト資産としての価値がある。API経由への書き換えは目的を破壊する |
| D-12 | PreviewExtractResponseに検算・ラベルフィールドなし | types.tsの型変更が必要。フェーズBで対応 |

---

## バリデーションルール（全件）

| # | レイヤー | 条件 | エラー内容 | 動作 | UI表示 |
|---|---|---|---|---|---|
| 1 | フロント（D&D） | ドラッグ&ドロップ時にimage/*またはapplication/pdf以外 | — | サイレント無視 | 表示なし |
| 2 | フロント（送信前） | MIME/拡張子がAI処理ホワイトリスト外 | — | AI処理せず補助対象として即返却 | ✅「補助対象ファイルです。」 |
| 3 | フロント（送信前） | SHA-256ハッシュが同バッチ内で完全一致 | 完全重複（同一ファイル） | OK判定（警告のみ） | ⚠「重複の可能性」 |
| 4 | サーバー | JSON解析失敗 / image（画像）空 / mimeType（形式）空 / clientId（顧問先ID）空 / MIMEホワイトリスト外 | リクエスト不正 | 400返却 | ❌「サーバーエラー (400)」 |
| 5 | 後処理 | document_count（証票枚数） >= 2 | 複数証票検知 | NG判定（最優先） | ❌「この画像にはN枚の証票が写っています。1枚ずつ撮影してください」 |
| 6 | 後処理 | source_type（証票種別） = non_journal / other / supplementary_doc | — | OK判定（バリデーションなし） | ✅「補助対象ファイルです。」 |
| 7 | 後処理 | fallback_applied（フォールバック適用） = true | AI処理失敗 | NG判定 | ❌「AI処理に失敗しました。撮り直してください」 |
| 8 | 後処理 | 各行のdate（日付）= null | 日付読み取り不能 | NG判定 | ❌「日付が読み取れません」 |
| 9 | 後処理 | 各行のamount（金額）= null or ≤ 0 | 金額読み取り不能 | NG判定 | ❌「金額が読み取れません」 |
| 10 | 後処理 | issuer_name（取引先）= null or 空文字 | 取引先読み取り不能 | NG判定 | ❌「取引先が読み取れません」 |
| 11 | 後処理 | 同バッチ内で同日・同額・同取引先が一致、またはT番号一致 | 重複疑い（内容一致） | OK判定（警告のみ） | ⚠「重複の可能性」 |
| 12 | フロント（例外） | fetch例外（ネットワーク切断等） | 通信障害 | NG判定 | ❌「通信エラー: {詳細}」 |

## 証票種別ごとのバリデーション対象

| 証票種別（source_type） | 日本語 | 各行の日付（date） | 各行の金額（amount） | 取引先（issuer_name） |
|---|---|---|---|---|
| receipt | 領収書 | 必須 | 必須 | 必須 |
| invoice_received | 受取請求書 | 必須 | 必須 | 必須 |
| tax_payment | 納付書 | 必須 | 必須 | 必須 |
| journal_voucher | 振替伝票 | 必須 | 必須 | 必須 |
| bank_statement | 通帳 | 不問 | 不問 | 不問 |
| credit_card | クレカ明細 | 不問 | 不問 | 不問 |
| cash_ledger | 現金出納帳 | 必須 | 必須 | 必須 |
| supplementary_doc | 補助書類 | 不問 | 不問 | 不問 |
| invoice_issued | 発行請求書 | 必須 | 必須 | 必須 |
| receipt_issued | 発行領収書 | 必須 | 必須 | 必須 |
| non_journal | 仕訳対象外 | 不問 | 不問 | 不問 |
| other | その他 | 不問 | 不問 | 不問 |

> **通帳・クレカ明細が不問の理由**: 行データ（line_items）がN件返れば十分。銀行名・カード会社名はStep 3（取引先照合）で特定する。アップロード時点でNG強制すると、行データが正常に読めているのに撮り直しを要求する誤判定が発生する。

---

## 実施手順（フェーズA: 現スキーマ維持のまま）

### 手順①: types.ts にフロント用型を追加

- **対象**: `src/api/services/pipeline/types.ts`
- **目的**: ReceiptAnalysisResult / AnalyzeOptions をここに移動。**PreviewExtractResponse / PreviewExtractRawResponse は変更しない**
- **内容**:
  - receiptService.ts L7-53 の ReceiptAnalysisResult 型を types.ts に移動
  - receiptService.ts L55-61 の AnalyzeOptions 型を types.ts に移動
- **潰す負債**: D-3

### 手順②: validatePreviewExtractResult.ts 新設（データ駆動バリデーション）

- **対象**: `src/shared/validatePreviewExtractResult.ts`（新設）
- **目的**: バリデーションロジックを1ファイルに集約。データ駆動設計でif連続を排除
- **依存**: `PreviewExtractResponse`型のみをimport（現types.tsをそのまま使う）
- **内容**:
  - SOURCE_TYPE_VALIDATION_CONFIG 定数テーブル（証票種別ごとの日付・金額・取引先の必須/不問をbooleanで定義）
  - VALIDATION_RULES 定数テーブル（優先順にルールID・check関数・エラーメッセージを定義）
  - ALLOWED_MIME_TYPES / ALLOWED_EXTENSIONS / MF_IMPORT_EXTENSIONS 定数
  - validateFileType() 関数（ファイル形式判定）
  - validatePreviewExtractResult() 関数（テーブルをループして最初にhitしたルールでOK/NG/補助対象を返す）
  - 入力: PreviewExtractResponse（現types.tsの型そのまま）
  - 出力: `{ ok: boolean; errorReason: string | null; supplementary?: boolean }`
- **潰す負債**: D-4, D-5, D-6, D-7, D-8
- **注意**: validate = 判定のみ。計算はpostprocessの責務。PreviewExtractResponseの型は一切触らない

### 手順③: receiptService.ts any排除 + validateに委譲

- **対象**: `src/mocks/services/receiptService.ts`
- **目的**: any型を排除し、PreviewExtractResponse型で型安全にAPIレスポンスを受け取る。バリデーションをvalidatePreviewExtractResult.tsに委譲
- **内容**:
  - ReceiptAnalysisResult型定義（L7-53）削除 → types.tsからimport
  - AnalyzeOptions型定義（L55-61）削除 → types.tsからimport
  - `const data = await response.json()` → `const data: PreviewExtractResponse = await response.json()`
  - 行データの`Record<string, unknown>` → PreviewExtractLineItem型
  - ALLOWED定数（L112-125）削除 → validatePreviewExtractResult.tsからimport
  - validateFileType関数（L131-142）削除 → validatePreviewExtractResult.tsからimport
  - analyzeReceiptReal内のif連続バリデーション（L230-303）削除 → validatePreviewExtractResult()呼び出しに置換
- **潰す負債**: D-1, D-2, D-3, D-4, D-5, D-6, D-7, D-8

### 手順④: MockUploadPage.vue MIME定数統一

- **対象**: `src/mocks/views/MockUploadPage.vue`
- **目的**: D&DフィルタのMIME判定で使う定数の二重定義を解消
- **内容**:
  - handleDrop内のimage/*判定をALLOWED_MIME_TYPESの定数参照に変更
  - validatePreviewExtractResult.tsからimport
- **潰す負債**: D-8

### 手順⑤: 動作確認

- tsc --noEmit エラー0件確認
- サーバー起動 → 画像アップロード → 日付・金額・取引先のNG判定確認 → 補助対象確認 → document_count確認

### 手順⑥: docs更新 + コミット

- task_unified.md 更新（実施済みセクションに追記）
- /commit手順に従い実行

---

## バリデーション統一ルール

**全てのバリデーション（判定）はvalidatePreviewExtractResult.ts 1箇所に統一する。**

| 責務 | 場所 | やること | やらないこと |
|---|---|---|---|
| 計算 | postprocess.ts | AI生出力の正規化・fallback適用・ProcessingMode判定 → PreviewExtractResponseのフィールドに格納 | OK/NG判定はしない |
| 判定 | validatePreviewExtractResult.ts | PreviewExtractResponseのフィールドを見てOK/NG/補助対象を判定する。データ駆動テーブルでルール評価 | 計算はしない（postprocessの結果を参照するだけ） |

→ receiptService.tsにもMockUploadPage.vueにもバリデーションロジックは**一切残さない**。

---

## 地雷注意事項

1. **PreviewExtractResponseの型を触るな** → フェーズAの鉄則。型変更はフェーズB
2. **validateにロジック寄せすぎるな** → postprocess = 計算、validate = 判定
3. **データ駆動のやりすぎ** → 単純 → config、複雑 → code
4. **code_quality.md遵守** → PowerShellファイル書き換え禁止、Supabase移行後も壊れない構造
5. **旧ファイル（previewExtract_postprocess.ts / previewExtract_schema.ts）は触るな** → フェーズBまで温存

---

## ReceiptAnalysisResult定義（フロント用。types.tsに移動する内容）

```typescript
export interface ReceiptAnalysisResult {
  ok: boolean;
  date: string | null;                    // YYYY-MM-DD
  amount: number | null;                  // 合計金額（整数）
  vendor: string | null;                  // 取引先名（issuer_nameから変換）
  errorReason: string | null;             // NGの場合の却下理由（UIに表示）
  supplementary?: boolean;                // 補助対象ファイル
  lineItems?: {
    line_index: number;
    date: string | null;
    description: string;
    amount: number;
    direction: 'expense' | 'income';
    balance: number | null;
  }[];
  metrics?: {
    source_type: string;
    source_type_confidence: number;
    direction: string;
    direction_confidence: number;
    processing_mode: string;
    preview_extract_reason: string | null;
    description: string | null;
    fallback_applied: boolean;
    duration_ms: number;
    duration_seconds: number;
    prompt_tokens: number;
    completion_tokens: number;
    thinking_tokens: number;
    token_count: number;
    cost_yen: number;
    model: string;
    original_size_kb: number;
    processed_size_kb: number;
    preprocess_reduction_pct: number;
  };
}

export interface AnalyzeOptions {
  clientId?: string;
  role?: string;
  device?: string;
  documentId?: string;
}
```

---

## フェーズBとの境界（明確化）

| 項目 | フェーズA（今回） | フェーズB（後回し） |
|---|---|---|
| PreviewExtractResponse型 | **触らない** | 検算・ラベル等フィールド追加 |
| PreviewExtractRawResponse型 | **触らない** | tax_entries等29フィールドに拡張 |
| PREVIEW_EXTRACT_SCHEMA | **触らない** | 旧PREVIEW_EXTRACT_RESPONSE_SCHEMAと統合 |
| postprocess.ts | **触らない** | previewExtract_postprocess.tsからロジック移植 |
| previewExtract_test.ts | **触らない** | 新旧両対応に改修（API経由化は行わない） |
| previewExtract_postprocess.ts | **触らない**（温存） | postprocess.tsに移植後に削除 |
| previewExtract_schema.ts | **触らない**（温存） | types.tsに統合後に削除 |
| validatePreviewExtractResult.ts | **新設** | — |
| receiptService.ts | **any排除 + validate委譲** | — |
| MockUploadPage.vue | **MIME定数統一** | — |
