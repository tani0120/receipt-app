# UI列 ↔ パイプライン マッピング仕様

LLM実装用。マッピング関数を書くための具体的なフィールド名・値・変換ルール。
1列検証するごとに更新する。

---

## 学習列（rule）

### 入力
- 層C（未着手）: 過去仕訳DBとの照合結果

### 変換ルール
```typescript
// RULE_APPLIED: 学習ルールが適用された仕訳
//   - 過去の仕訳パターンと完全一致 → ルールの値で自動入力
//   - labels[]に'RULE_APPLIED'追加
//
// RULE_AVAILABLE: 適用可能なルールが存在するが未適用
//   - 過去仕訳DBに類似パターンあり → 候補として表示
//   - labels[]に'RULE_AVAILABLE'追加
//
// 排他的: RULE_APPLIED と RULE_AVAILABLE は同時に付与しない
// RULE_APPLIED が付いている場合、AIの推定値よりルールの値を完全優先
```

### 出力先
- DB: `journals.labels[]` にTEXT値として追加
- UI: rule列でlabels[]からRULE_APPLIED/RULE_AVAILABLEを検索してアイコン表示

### 注意
- 層C依存のため現時点では未実装
- ルール定義: journal_v2_20260214.md §2 ルール

---

## 証票列（labelType）

### 入力
- Geminiフィールド: `GeminiClassifyResponse.voucher_type` (VoucherType型)
- 型: string, enum 7値

### 変換ルール
```typescript
// voucher_type → journals.labels[] に追加
function mapVoucherTypeToLabel(voucherType: VoucherType): string {
    // そのまま追加（値が一致しているため変換不要）
    return voucherType;
    // 'RECEIPT' → labels[]に'RECEIPT'追加
    // 'INVOICE' → labels[]に'INVOICE'追加
    // 'TRANSPORT' → labels[]に'TRANSPORT'追加
    // 'CREDIT_CARD' → labels[]に'CREDIT_CARD'追加
    // 'BANK_STATEMENT' → labels[]に'BANK_STATEMENT'追加
    // 'MEDICAL' → labels[]に'MEDICAL'追加
    // 'NOT_APPLICABLE' → labels[]に'NOT_APPLICABLE'追加
}
```

### 出力先
- DB: `journals.labels[]` にTEXT値として追加
- UI: labelType列でlabels[]からRECEIPT/INVOICE/TRANSPORT/CREDIT_CARD/BANK_STATEMENT/MEDICAL/NOT_APPLICABLEを検索してアイコン表示

### 注意
- Gemini出力のvoucher_typeは排他的（1値のみ）。labels[]配列に1個追加する。
- VoucherType定義: classify_schema.ts L25-32
- DB labels定義: journal_v2_20260214.md §2 証憑種類

---

## 警告列（warning）

### 入力
- 層B関数群の判定結果から `journals.labels[]` に追加

### 変換ルール

#### 1. DEBIT_CREDIT_MISMATCH / 2. TAX_CALCULATION_ERROR（既存ロジック）
```typescript
// checkDebitCreditMismatch(): 借方合計 ≠ 貸方合計 → labels[]に'DEBIT_CREDIT_MISMATCH'追加
// checkTaxMismatch(): 税率明細合計 ≠ total_amount → labels[]に'TAX_CALCULATION_ERROR'追加
```

#### 3. MISSING_FIELD / 4. UNREADABLE_FAILED / 8. UNREADABLE_ESTIMATED（判定マトリクス）
```typescript
// 必須フィールド(date, amount等)ごとに判定:
// on_document=false, value=null   → labels[]に'MISSING_FIELD'追加
// on_document=true,  value=null   → labels[]に'UNREADABLE_FAILED'追加
// on_document=true,  value!=null, confidence低 → labels[]に'UNREADABLE_ESTIMATED'追加
// on_document=true,  value!=null, confidence高 → 正常（追加なし）
```

#### 5. DUPLICATE_CONFIRMED（新規ロジック）
```typescript
// 層B: 同バッチ内のファイルSHA256比較 → 一致なら'DUPLICATE_CONFIRMED'追加
// 層C: 過去DB内のファイルハッシュ照合 → 一致なら'DUPLICATE_CONFIRMED'追加
```

#### 6. MULTIPLE_VOUCHERS（Gemini出力そのまま）
```typescript
// 層A: has_multiple_vouchers==true → labels[]に'MULTIPLE_VOUCHERS'追加
// 1画像に2枚以上の証票が写り込んでいる場合
```

#### 7. DUPLICATE_SUSPECT（既存ロジック拡張）
```typescript
// 層B: checkDuplicates() — 同バッチ内で日付+金額+証票タイプ一致 → 'DUPLICATE_SUSPECT'追加
// 層C: 過去DB照合（日付+金額+科目一致）→ 'DUPLICATE_SUSPECT'追加
// ※定期支払の誤検出防止ルール必要
```

#### 8. DATE_OUT_OF_RANGE（既存ロジック修正）
```typescript
// 現状: checkDateAnomaly() — 未来 or 1年以上前
// 修正: 会計期間外 or 未来日付 → 'DATE_OUT_OF_RANGE'追加
// テスト用: date < 2025-04-01 || date > 2026-03-31
// 将来: 会計期間をテナント設定から取得
```

#### 10. MEMO_DETECTED（handwritten_flag===MEANINGFULのみ発火）
```typescript
// 層A: handwritten_flag==='MEANINGFUL' → labels[]に'MEMO_DETECTED'追加
// NON_MEANINGFUL/NONEは警告なし。角印・受領印・スタンプは手書きに含めない
```

### 出力先
- DB: `journals.labels[]` にTEXT値として追加（複数同時付与可能）
- UI: warning列でlabels[]から10種を検索、赤(🔴)=1-6, 黄(🟡)=7-10 でアイコン表示

### 注意
- スキーマ変更必要: `date_on_document: boolean`, `amount_on_document: boolean` を層Aに追加
- 既存の `date_unreadable`, `amount_unreadable` はそのまま維持
- 旧ラベル AMOUNT_ANOMALY, OCR_FAILED, MISSING_RECEIPT, OCR_LOW_CONFIDENCE, HAS_MEMO は廃止
- HAS_MEMO → MEMO_DETECTED（警告#9）に昇格。担当者メモはコメント列（staff_notes.memo）で代用
- 警告ラベル定義: journal_v2_20260214.md §2 警告ラベル

---

## クレ払い列（creditCardPayment）

### 入力
- Geminiフィールド: `GeminiClassifyResponse.is_credit_card_payment` (boolean)

### 変換ルール
```typescript
// labels[]には追加しない（属性であり警告ではない）
// journals.is_credit_card_payment カラムに直接格納
// true: クレジットカード払い（カード会社ロゴ、「カード」テキスト、下4桁番号等を検出）
// false: それ以外（デフォルト）
```

### 出力先
- DB: `journals.is_credit_card_payment` BOOLEAN（独立カラム。labels[]ではない）
- UI: creditCardPayment列で `is_credit_card_payment===true` なら💳アイコン表示

### 注意
- voucher_typeとは独立。RECEIPT/INVOICE等でもクレカ払いは有り得る
- 定義: journal_v2_20260214.md 統合対応表 #10

---

## 軽減列（taxRate）

### 入力
- Geminiフィールド: `GeminiClassifyResponse.tax_entries[]`
- 各エントリの `tax_rate` を確認

### 変換ルール
```typescript
// tax_entries[]に税率8%のエントリが1つでも存在する場合:
//   → labels[]に'MULTI_TAX_RATE'追加
// 全エントリが10%のみの場合:
//   → 追加なし
function checkMultiTaxRate(taxEntries: TaxEntry[]): boolean {
    return taxEntries.some(e => e.tax_rate === 8);
}
```

### 出力先
- DB: `journals.labels[]` にTEXT値として追加
- UI: taxRate列でlabels[]からMULTI_TAX_RATEを検索、存在すれば「軽」アイコン表示

### 注意
- 軽減税率（8%）の有無判定。税率0%や免税は別扱い
- 制度系ラベル定義: journal_v2_20260214.md §2 制度系

---

## 証票メモ列（memo）

### 入力
- Geminiフィールド: `GeminiClassifyResponse.handwritten_flag` (enum: 'NONE' | 'NON_MEANINGFUL' | 'MEANINGFUL')
- Geminiフィールド: `GeminiClassifyResponse.handwritten_memo_content` (string | null)

### 変換ルール
```typescript
// handwritten_flag==='MEANINGFUL' の場合:
//   → labels[]に'MEMO_DETECTED'追加（警告列にも表示される）
//   → handwritten_memo_content をDBに格納
// handwritten_flag==='NON_MEANINGFUL' の場合:
//   → 警告なし。contentがあればDBに格納（ホバー表示用）
// handwritten_flag==='NONE' の場合:
//   → 何もしない
```

### 出力先
- DB: `journals.handwritten_memo_content` (TEXT, nullable)
- UI: memo列でhandwritten_flag!=='NONE'ならメモアイコン表示、ホバーでcontent表示

### 注意
- 証票上の手書きメモ（Geminiが画像解析で検出）と、担当者メモ（staff_notes.memo）は別物
- 担当者メモはコメント列で表示

---

## 適格列（invoice）

### 入力
- Geminiフィールド: `GeminiClassifyResponse.invoice_registration` (string | null)
- 適格請求書発行事業者の登録番号（T+13桁）

### 変換ルール
```typescript
// invoice_registration が null でない（登録番号あり）:
//   → labels[]に'INVOICE_QUALIFIED'追加
// invoice_registration が null（登録番号なし）:
//   → labels[]に'INVOICE_NOT_QUALIFIED'追加
//
// 排他的: 同時に付与しない
function mapInvoiceQualification(registration: string | null): string {
    return registration !== null ? 'INVOICE_QUALIFIED' : 'INVOICE_NOT_QUALIFIED';
}
```

### 出力先
- DB: `journals.labels[]` にTEXT値として追加、`journals.invoice_registration` に登録番号格納
- UI: invoice列でlabels[]からINVOICE_QUALIFIED/INVOICE_NOT_QUALIFIEDを検索してアイコン表示

### 注意
- 制度系ラベル定義: journal_v2_20260214.md §2 制度系
- 登録番号のバリデーション（T+13桁形式）は層Bで実施可能

---

## データ列（取引日〜貸方金額）

### 入力
- Geminiフィールド: `GeminiClassifyResponse.date` (string, YYYY-MM-DD)
- Geminiフィールド: `GeminiClassifyResponse.suggestions[].description` (string)
- Geminiフィールド: `GeminiClassifyResponse.suggestions[].entries[]` (JournalSuggestionEntry)

### 変換ルール
```typescript
// 取引日（#12）:
//   response.date → journals.transaction_date
//
// 摘要（#13）:
//   response.suggestions[0].description → journals.description
//
// 借方/貸方（#14-21）:
//   suggestions[0].entries[] を entry_type で分離:
//   entry_type='debit'  → debit.account, debit.amount
//   entry_type='credit' → credit.account, credit.amount
//
// ギャップG1: sub_account（借方補助#15、貸方補助#19）
//   → Geminiスキーマに未定義。追加要
//
// ギャップG2: tax_category（借方税区分#16、貸方税区分#20）
//   → Geminiスキーマに未定義。追加要
```

### 出力先
- DB: `journals.transaction_date`, `journals.description`, `journal_entries.account`, `journal_entries.amount` 等
- UI: 各列でjournalオブジェクトから直接取得（text型/amount型）

### 注意
- suggestions[]は複数候補を返す可能性がある。UI表示はsuggestions[0]（最も確度の高い候補）
- sub_account, tax_categoryはGeminiスキーマへの追加が必要（ギャップG1, G2）
- データ列定義: journal_v2_20260214.md §2 統合対応表 #12-21

---

## 情報源

| ファイル | 内容 |
|---------|------|
| src/scripts/classify_schema.ts | 層A型定義+スキーマ（VoucherType L25-32, JournalSuggestionEntry L57-62） |
| src/scripts/classify_postprocess.ts | 層B判定ロジック |
| src/mocks/columns/journalColumns.ts | UI列定義（23列） |
| docs/genzai/02_database_schema/journal/journal_v2_20260214.md | DB設計書 |
| docs/genzai/02_database_schema/journal/migration.sql | DDL |
