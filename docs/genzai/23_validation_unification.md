# 23: バリデーション統合 + スキーマ統一 + any排除リファクタ

## 概要

バリデーションロジックの散在（4ファイル）、スキーマ分裂（3ファイル）、any型によるAPIレスポンスアクセス、取引先バリデーション未実装等の技術的負債を一括で解消する。データ駆動設計を導入し、ルール追加を1箇所で完結させる。

## 設計原則

```
外部（Gemini）→ service → domain（types.ts）→ 上位（API / test）
```

- **外→内の一方向依存**。内から外には依存しない
- **ClassifyRawResponseはservice内で完結**。外にはClassifyResponseだけ出す
- **postprocess = 計算**、**validate = 判定**。役割を分ける
- **データ駆動**: 単純なルール → 定数テーブル、複雑なロジック → code

## 最終構造

```
types.ts（唯一の真実）
  ClassifyRawResponse（生レスポンス → service内のみ）
  ClassifyResponse（フル版。29フィールド + 検算 + ラベル）
  ReceiptAnalysisResult（フロント用。必要なフィールドだけ）
    ↑ import
classify.service.ts（外部依存隔離）
  CLASSIFY_SCHEMA（Gemini固有、ここに閉じる）
  Gemini呼び出し → ClassifyRawResponse
    ↓
postprocess.ts（計算）
  ClassifyRawResponse → ClassifyResponse に変換
  税検算・貸借検算・日付異常・ラベル生成もここで計算
    ↓
validateClassifyResult.ts（判定）
  ClassifyResponse → OK/NG/補助対象 判定（データ駆動）
    ↓
receiptService.ts
  API呼び出し → validateClassifyResult() → ReceiptAnalysisResult
    ↓
classify_test.ts
  API呼び出し（/api/pipeline/classify）→ ClassifyResponse だけ検証
```

---

## 技術的負債一覧（全件今回で潰す）

| # | 負債 | 場所 | 危険度 | 内容 |
|---|---|---|---|---|
| D-1 | any型でAPIレスポンスアクセス | receiptService.ts L188-228 | 🔴致命 | `response.json()` → any。型チェックなしで参照。スキーマ変更時にコンパイルエラーにならない |
| D-2 | 行データの型がany | receiptService.ts L221 | 🔴致命 | `Record<string, unknown>` で行データにアクセス |
| D-3 | ReceiptAnalysisResult型のハードコード | receiptService.ts L7-53 | 🟡高 | types.tsに集約すべき型がファイル内にインライン定義されている |
| D-4 | バリデーションのif連続ハードコード | receiptService.ts L230-303 | 🟡高 | データ駆動設計ではなくif連続。ルール追加時に漏れる |
| D-5 | 取引先（issuer_name）バリデーション未実装 | receiptService.ts | 🔴致命 | 日付・金額はチェックしているが取引先はスルー |
| D-6 | supplementary_docの日付・金額バリデーション免除 | receiptService.ts L231 | 🟡高 | multiLineTypesに含まれていて免除されている（間違い） |
| D-7 | 通帳・クレカの行データバリデーション未実装 | receiptService.ts | 🟡高 | 各行のdate/amount/取引先をチェックしていない |
| D-8 | MIME定数の二重定義 | receiptService.ts L112 + MockUploadPage.vue L424 | 🟡高 | 同じMIME条件が2箇所に書かれている |
| D-9 | スキーマ分裂（3ファイル） | types.ts / classify_schema.ts / receiptService.ts | 🔴致命 | 3つの型定義が別々に存在。フィールド名も異なる |
| D-10 | classify_postprocess.tsが本番未接続 | classify_postprocess.ts | 🟡高 | 税検算・貸借検算・ラベル生成が本番パイプラインで使われていない |
| D-11 | classify_test.tsがGemini直呼び出し | classify_test.ts | 🟡高 | LLMの型がテストに直接漏洩。SDK変更でテスト全壊 |
| D-12 | ClassifyResponseに検算・ラベルフィールドなし | types.ts | 🟡高 | 税検算・貸借検算・日付異常・ラベルがAPIレスポンスに含まれない |
| D-13 | ClassifyRawResponseが外部に漏洩する可能性 | 現状は漏れていない | 🟢低 | 今後の変更で漏らさないよう注意 |

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
| bank_statement | 通帳 | 必須 | 必須 | 必須 |
| credit_card | クレカ明細 | 必須 | 必須 | 必須 |
| cash_ledger | 現金出納帳 | 必須 | 必須 | 必須 |
| supplementary_doc | 補助書類 | 不問 | 不問 | 不問 |
| invoice_issued | 発行請求書 | 必須 | 必須 | 必須 |
| receipt_issued | 発行領収書 | 必須 | 必須 | 必須 |
| non_journal | 仕訳対象外 | 不問 | 不問 | 不問 |
| other | その他 | 不問 | 不問 | 不問 |

---

## 実施手順（型を先に固めてからロジックを直す）

### 手順①: types.ts 型統一【最優先】

- **対象**: `src/api/services/pipeline/types.ts`
- **目的**: 型定義を1箇所に集約する。新規ファイルは作らない
- **内容**:
  - ReceiptAnalysisResult型をreceiptService.tsからここに移動
  - AnalyzeOptions型をreceiptService.tsからここに移動
  - ClassifyResponseにフィールド追加（税検算結果、貸借検算結果、日付異常、ラベル、ステータス）
  - ClassifyRawResponseにフィールド追加（tax_entries, journal_entry_suggestions, handwritten_flag等。旧CLASSIFY_RESPONSE_SCHEMAと同等）
- **潰す負債**: D-3, D-9, D-12

### 手順②: classify.service.ts CLASSIFY_SCHEMA拡張

- **対象**: `src/api/services/pipeline/classify.service.ts`
- **目的**: CLASSIFY_SCHEMAを旧CLASSIFY_RESPONSE_SCHEMAと同等のフル版に昇格する。Geminiに全フィールドを出力させる
- **内容**:
  - CLASSIFY_SCHEMAに旧スキーマの全フィールドを追加（tax_entries, journal_entry_suggestions, handwritten_flag, is_invoice_qualified等）
  - ClassifyRawResponseのフィールド追加に合わせてマッピング更新
- **潰す負債**: D-12（の前提作成）

### 手順③: postprocess.ts 計算ロジック追加

- **対象**: `src/api/services/pipeline/postprocess.ts`
- **目的**: ClassifyRawResponse → ClassifyResponse の変換に、税検算・貸借検算・日付異常・ラベル生成を追加する
- **内容**:
  - classify_postprocess.tsから以下を移植:
    - checkTaxMismatch()（税検算）
    - checkDebitCreditMismatch()（貸借検算）
    - checkDateAnomaly()（日付異常検出）
    - determineStatus()（ステータス判定）
    - generateLabels()（ラベル自動生成）
    - estimateCost()（コスト計算）
  - 旧スキーマのフィールド名を新スキーマに変換（voucher_type → source_type等）
  - ClassifyResponseに計算結果を含めて返す
- **潰す負債**: D-10
- **注意**: postprocess = 計算。判定はvalidateに任せる

### 手順④: validateClassifyResult.ts 新設（データ駆動バリデーション）

- **対象**: `src/shared/validateClassifyResult.ts`（新設）
- **目的**: バリデーションロジックを1ファイルに集約する。データ駆動設計で実装し、if連続を排除する
- **内容**:
  - SOURCE_TYPE_CONFIG定数テーブル（証票種別ごとの日付・金額・取引先の必須/不問をbooleanで定義）
  - VALIDATION_RULES定数テーブル（優先順にルールID・check関数・エラーメッセージを定義）
  - ALLOWED_MIME_TYPES / ALLOWED_EXTENSIONS / MF_IMPORT_EXTENSIONS 定数
  - validateFileType()関数（ファイル形式判定）
  - validateClassifyResult()関数（テーブルをループして最初にhitしたルールでOK/NG/補助対象を返す）
  - checkDuplicatesInBatch()関数（同バッチ内の同日同額同取引先 + T番号一致の重複検出）
- **潰す負債**: D-4, D-5, D-6, D-7, D-8
- **注意**: validate = 判定のみ。計算はpostprocessの責務

### 手順⑤: classify_test.ts API経由に変更

- **対象**: `src/scripts/classify_test.ts`
- **目的**: 旧スキーマ（classify_schema.ts）依存を完全排除し、API経由でClassifyResponseのみ検証する構造にする
- **内容**:
  - import元をclassify_schema.ts → types.tsに変更
  - Gemini直呼び出し → `/api/pipeline/classify` API経由に変更
  - 旧型名（GeminiClassifyResponse, ClassifyResult等）を新型名に置換
  - 重複検出をclassify_postprocess.ts → validateClassifyResult.tsから参照
  - issuer_name（取引先名）のログ出力追加
  - テストはClassifyResponseだけを検証。LLMの存在を知らない
- **潰す負債**: D-9, D-11

### 手順⑥: receiptService.ts any排除 + 型付け

- **対象**: `src/mocks/services/receiptService.ts`
- **目的**: any型を排除し、ClassifyResponse型で型安全にAPIレスポンスを受け取る。バリデーションをvalidateClassifyResult.tsに委譲する
- **内容**:
  - ReceiptAnalysisResult型定義（L7-53）削除 → types.tsからimport
  - AnalyzeOptions型定義（L55-61）削除 → types.tsからimport
  - `const data = await response.json()` → `const data: ClassifyResponse = await response.json()`
  - 行データの`Record<string, unknown>` → ClassifyResponseLineItem型
  - ALLOWED定数（L112-125）削除 → validateClassifyResult.tsからimport
  - validateFileType関数（L131-142）削除 → validateClassifyResult.tsからimport
  - analyzeReceiptReal内のif連続バリデーション（L230-303）削除 → validateClassifyResult()呼び出しに置換
  - issuer_name（取引先名）のログ出力追加
- **潰す負債**: D-1, D-2, D-3, D-4, D-5, D-6, D-7, D-8

### 手順⑦: MockUploadPage.vue MIME定数統一

- **対象**: `src/mocks/views/MockUploadPage.vue`
- **目的**: D&DフィルタのMIME判定で使う定数の二重定義を解消する
- **内容**:
  - handleDrop内（L423-424）のimage/*判定をALLOWED_MIME_TYPESの定数参照に変更
  - validateClassifyResult.tsからimport
- **潰す負債**: D-8

### 手順⑧: 旧ファイル削除

- **対象**:
  - `src/scripts/classify_postprocess.ts` → 削除（全ロジックpostprocess.tsに移植済み）
  - `src/scripts/classify_schema.ts` → 削除（classify_test.tsの依存付け替え済み）
- **潰す負債**: D-9, D-10

### 手順⑨: 動作確認

- サーバー起動 → 画像アップロード → 日付・金額・取引先のNG判定確認 → 補助対象確認 → document_count確認 → 重複検出確認 → 税検算結果確認

### 手順⑩: docs/pipeline_design_master.md 更新

- バリデーションルール一覧更新
- スキーマ統一の記録追加
- データ駆動設計の記録追加

### 手順⑪: docs/task_unified.md 更新

- 実施済みタスクに追加

### 手順⑫: コミット

- /commit手順に従い実行

---

## 地雷注意事項

1. **ClassifyRawResponseを外で使うな** → Rawはservice内で完結。外にはClassifyResponseだけ出す
2. **validateにロジック寄せすぎるな** → postprocess = 計算、validate = 判定
3. **データ駆動のやりすぎ** → 単純 → config、複雑 → code
4. **code_quality.md遵守** → PowerShellファイル書き換え禁止、Supabase移行後も壊れない構造
5. **既存ロジックを上書き・破壊するな** → classify_postprocess.tsの全ロジック（税検算、貸借検算、日付異常、ステータス判定、ラベル生成、コスト計算）は1つも消さずにpostprocess.tsに移植保全する

---

## バリデーション統一ルール

**全てのバリデーション（判定）はvalidateClassifyResult.ts 1箇所に統一する。**

| 責務 | 場所 | やること | やらないこと |
|---|---|---|---|
| 計算 | postprocess.ts | 税検算結果を算出、貸借検算結果を算出、日付異常を検出、ラベルを生成、コストを計算 → ClassifyResponseのフィールドに格納 | OK/NG判定はしない |
| 判定 | validateClassifyResult.ts | ClassifyResponseのフィールドを見てOK/NG/補助対象を判定する。データ駆動テーブルでルール評価 | 計算はしない（postprocessの結果を参照するだけ） |

→ receiptService.tsにもMockUploadPage.vueにもバリデーションロジックは**一切残さない**。

---

## 旧→新フィールドマッピング表

classify_postprocess.tsで使っている旧フィールド名と、types.tsの新フィールド名の対応：

| 旧（classify_schema.ts） | 新（types.ts） | 備考 |
|---|---|---|
| voucher_type | source_type | 値も変更（RECEIPT → receipt等） |
| voucher_type_confidence | source_type_confidence | |
| has_multiple_vouchers | document_count >= 2 | booleanから数値判定に変更 |
| is_not_applicable | source_type === 'non_journal' | booleanからenum判定に変更 |
| not_applicable_reason | — | ClassifyRawResponseに追加するか検討 |
| date_unreadable | — | ClassifyRawResponseに追加 |
| amount_unreadable | — | ClassifyRawResponseに追加 |
| issuer_unreadable | — | ClassifyRawResponseに追加 |
| tax_entries | tax_entries | ClassifyRawResponseに追加（現状なし） |
| journal_entry_suggestions | journal_entry_suggestions | ClassifyRawResponseに追加（現状なし） |
| handwritten_flag | handwritten_flag | ClassifyRawResponseに追加（現状なし） |
| handwritten_memo_content | handwritten_memo_content | ClassifyRawResponseに追加（現状なし） |
| is_invoice_qualified | is_invoice_qualified | ClassifyRawResponseに追加（現状なし） |
| invoice_registration_number | invoice_registration_number | ClassifyRawResponseに追加（現状なし） |
| has_multiple_tax_rates | has_multiple_tax_rates | ClassifyRawResponseに追加（現状なし） |
| is_medical_expense | is_medical_expense | ClassifyRawResponseに追加（現状なし） |
| is_credit_card_payment | is_credit_card_payment | ClassifyRawResponseに追加（現状なし） |
| receipt_items | receipt_items | ClassifyRawResponseに追加（現状なし） |
| payment_method | payment_method | ClassifyRawResponseに追加（現状なし） |
| issuer_branch | issuer_branch | ClassifyRawResponseに追加（現状なし） |
| bank_name_guess | bank_name_guess | ClassifyRawResponseに追加（現状なし） |
| bank_name_confidence | bank_name_confidence | ClassifyRawResponseに追加（現状なし） |
| bank_name_evidence | bank_name_evidence | ClassifyRawResponseに追加（現状なし） |
| is_composite_transaction | is_composite_transaction | ClassifyRawResponseに追加（現状なし） |

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
    classify_reason: string | null;
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
