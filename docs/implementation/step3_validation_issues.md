# Step 3実装計画の検証結果

> [!WARNING]
> ## ⚠️ このファイルの位置づけ
> - **検索用アーカイブ**です
> - **最新の意思決定・項目リスト**は [UI_MASTER_v2.md](../../docs/UI_MASTER_v2.md) を参照
> - このファイルは2026-01-24時点のスナップショット
> - 意思決定情報は古い可能性があります

**作成日**: 2026-01-23  
**更新日**: 2026-01-24  
**ステータス**: 検証完了 → 修正が必要

---

## ❌ 発見された問題点

### 問題1: ファイル形式別プロンプトが未実装 ❌

**指摘内容**:
> AIプロンプトはファイル形式ごとでなくてもよいのか？

**検証結果**:
- `step2_l1-3_definition.md` L206には「カテゴリでAIプロンプトを最適化」と明記
- `FileTypeEnum` には7種類のファイルタイプが定義されている：
  - `RECEIPT`（領収書）
  - `INVOICE`（請求書）
  - `BANK_CSV`（通帳CSV）
  - `BANK_IMAGE`（通帳画像）
  - `CREDIT_CSV`（クレカ明細CSV）
  - `CREDIT_IMAGE`（クレカ明細画像）
  - `OTHER`（その他）
- 現状の問題: `step3_ai_prompt_design.md` では単一のプロンプト（`RECEIPT_TO_JOURNAL_PROMPT`）しか用意していない

**修正方針**: ✅ ファイルタイプごとに最適化されたプロンプトを用意する

```typescript
// 必要なプロンプト
export const RECEIPT_TO_JOURNAL_PROMPT = `...`;  // 領収書用
export const INVOICE_TO_JOURNAL_PROMPT = `...`;  // 請求書用
export const BANK_CSV_TO_JOURNAL_PROMPT = `...`; // 通帳CSV用
export const BANK_IMAGE_TO_JOURNAL_PROMPT = `...`; // 通帳画像用
export const CREDIT_CSV_TO_JOURNAL_PROMPT = `...`; // クレカCSV用
export const CREDIT_IMAGE_TO_JOURNAL_PROMPT = `...`; // クレカ画像用
```

---

### 問題2: 計算期間外チェックが欠如 ❌

**指摘内容**:
> 計算期間外...は検知できるのか？

**検証結果**:
- `client-ui-requirements.md` L106には `fiscalMonth`（決算月）が定義されている
- `ClientSchema`には会計期間の情報が含まれている
- しかし、`JournalEntrySchema` には会計期間のチェック機能がない
- `step3_ai_prompt_design.md` のプロンプトにも会計期間外の警告機能がない

**問題の具体例**:
```
顧問先A: 決算月 = 3月（会計期間: 2025/04/01 - 2026/03/31）
領収書の日付: 2026/04/05
→ これは「計算期間外」なのに、検知できない！
```

**修正方針**:
- ✅ `JournalLine`に `isOutOfPeriod` フラグを追加
- ✅ `TaxResolutionService`に `validateAccountingPeriod()` メソッドを追加
- ✅ AIプロンプトに「会計期間外の場合は警告フラグを立てる」指示を追加

```typescript
// JournalLineSchemaに追加
isOutOfPeriod: z.boolean().optional().describe('会計期間外か（警告）'),
outOfPeriodReason: z.string().optional().describe('期間外の理由（例: "次期の日付"）'),
```

---

### 問題3: 重複検知機能が欠如 ❌

**指摘内容**:
> 重複は検知できるのか？

**検証結果**:
- `UseCase`には「UC-013: 重複排除」が記載されている
- しかし、`JournalEntrySchema` には重複検知機能がない
- `step3_ai_prompt_design.md` には重複検知の仕組みがない

**問題の具体例**:
```
同じ領収書を2回アップロードした場合:
  - 1回目: JournalEntry #001（2026-01-23, ABC Inc, 1100円）
  - 2回目: JournalEntry #002（2026-01-23, ABC Inc, 1100円）← 重複！
→ これを検知できない！
```

**修正方針**:
- ✅ `JournalEntry`に `duplicateCheckHash` を追加（日付+金額+相手先のハッシュ）
- ✅ `JournalSemanticGuard` に `detectDuplicates()` メソッドを追加
- ✅ UI側で「類似の仕訳が存在します」警告を表示

```typescript
// JournalEntrySchemaに追加
duplicateCheckHash: z.string().describe('重複検知用ハッシュ'),
isDuplicateSuspected: z.boolean().optional().describe('重複の疑いあり'),
similarEntries: z.array(z.string()).optional().describe('類似仕訳のIDリスト'),
```

---

### 問題4: 型定義の厳密性不足 ❌

**指摘内容**:
> 型定義は正しいか？型定義以外の出力はされないようになっているのか？

**検証結果**:
`step3_ai_prompt_design.md` の実装では、Gemini APIの出力を厳密にスキーマに従わせる仕組みが不十分

**現状のコード**:
```typescript
const result = await response.json();
const journalData = JSON.parse(result.candidates[0].content.parts[0].text);
const validated = JournalEntrySchema.parse(journalData); // ← エラー時の処理が不明確
```

**問題点**:
- Gemini APIが想定外のフィールドを返した場合の処理が不明確
- `JournalEntrySchema.parse()` がエラーをスローした場合の再試行ロジックがない
- AIが型定義以外の出力（説明文等）を返した場合の処理が不明確

**修正方針**:
- ✅ Zodの`.strict()`モードを使用して、スキーマ外のフィールドを厳密に拒否
- ✅ エラー時の再試行ロジックを実装（最大3回）
- ✅ プロンプトに「JSON形式のみ、説明文は不要」と明記

```typescript
// 厳密な型定義
export const JournalEntrySchema = z.object({...}).strict(); // ← .strict()追加

// エラー処理
try {
  const validated = JournalEntrySchema.parse(journalData);
  return validated;
} catch (error) {
  if (error instanceof ZodError) {
    // スキーマ検証エラー → 再試行
    console.error('スキーマ検証エラー:', error.errors);
    throw new SchemaValidationError(error.errors);
  }
}
```

---

### 問題5: AIプロンプトの設計が不適切 ❌

**指摘内容**:
> 過去の議論を踏まえてプロンプトは適正か？

**検証結果**:
`step3_ai_prompt_design.md` のプロンプトには以下の問題がある：

**5-1. 税額の三重構造が不明確**
- `taxAmountFromDocument` と `taxAmountCalculated` の違いが説明不足
- AIが混同する可能性がある

**5-2. 勘定科目の選択基準が不明確**
- 「雑費」なのか「会議費」なのか、AIが判断基準を持っていない
- プロンプトに勘定科目マッピングのルールが必要

**5-3. 顧問先情報が渡されていない**
- プロンプトに `clientCode` が渡されていない
- 顧問先ごとの会計設定（税込/税抜、現金/発生等）が考慮されていない

**修正方針**:
- ✅ プロンプトに税額の三重構造を明確に説明
- ✅ 勘定科目マッピングルールを追加
- ✅ 顧問先情報（会計設定）をプロンプトに含める

```typescript
static async generateJournalEntry(
  imageBase64: string,
  clientId: string,     // 追加
  client: Client        // 追加: 顧問先の会計設定
): Promise<JournalEntry> {
  const prompt = this.buildPrompt(client); // 顧問先情報を渡す
  ...
}
```

---

## 📋 修正が必要なファイル

### 1. `JournalEntrySchema.ts` - スキーマ拡張
- `.strict()` モードを追加
- `duplicateCheckHash` を追加
- `isDuplicateSuspected` を追加
- `similarEntries` を追加

### 2. `JournalLineSchema.ts` - スキーマ拡張
- `isOutOfPeriod` を追加
- `outOfPeriodReason` を追加

### 3. `JournalSemanticGuard.ts` - ビジネスルール追加
- `validateAccountingPeriod()` メソッドを追加
- `detectDuplicates()` メソッドを追加

### 4. `TaxResolutionService.ts` - サービス拡張
- `validateAccountingPeriod()` メソッドを追加

### 5. `step3_ai_prompt_design.md` - プロンプト設計の全面見直し
- ファイルタイプごとのプロンプトを作成（7種類）
- 税額の三重構造を明確化
- 勘定科目マッピングルールを追加
- 顧問先情報をプロンプトに含める
- 計算期間外チェックの指示を追加
- JSON形式のみ出力するよう明記

### 6. `GeminiVisionService.ts` - 実装の全面見直し
- エラー処理の強化（再試行ロジック）
- スキーマ検証エラー時の処理
- 顧問先情報を引数に追加

---

## 🚨 重要度の判定

| 問題 | 重要度 | 理由 |
|------|-------|------|
| 問題1: ファイル形式別プロンプト | 高 | 設計決定と矛盾 |
| 問題2: 計算期間外チェック | 中 | 実運用で必要だが、Phase 2延期も検討可能 |
| 問題3: 重複検知 | 中 | UseCaseに記載あり、実装すべき |
| 問題4: 型定義の厳密性 | 高 | データ整合性の根幹 |
| 問題5: プロンプト設計 | 高 | AI精度に直結 |

---

## 📖 推奨される対応順序

1. **問題4（型定義の厳密性）** ← まずこれを修正
2. **問題5（プロンプト設計）** ← 次にプロンプトを全面見直し
3. **問題1（ファイル形式別プロンプト）** ← プロンプトを7種類作成
4. **問題3（重複検知）** ← UseCaseに記載あり、実装必須
5. **問題2（計算期間外チェック）** ← Phase 2延期も検討

---

## 次のアクション

### 選択肢A: Step 3実装計画を全面的に作り直す
- 所要時間: 2-3時間
- 利点: 正確な実装計画
- 欠点: 時間がかかる

### 選択肢B: 重要度の高い問題のみ修正して進める
- 所要時間: 1時間
- 利点: 素早く進める
- 欠点: 後で問題が発生する可能性

**推奨**: 選択肢Aで全面的に作り直す
