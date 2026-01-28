# TD-001: 型定義再設計案（Phase 2）

**作成日**: 2026-01-24  
**ステータス**: Phase 2 - 設計案（実装前）  
**重要**: **この設計案はユーザー承認が必要です。承認なく実装を行いません。**

---

## 🎯 設計の目標

1. **型定義の一元化**: types/journal.ts を Zodスキーマ（JournalEntrySchema.ts）と完全に一致させる
2. **ADR-011準拠**: Partial<T> の排除、any型の排除
3. **型の二重管理を解消**: types/journal.ts と types/firestore.ts の関係を明確化

---

## ✅ 重要な発見

### **Zodスキーマは既に正式仕様に準拠している**

**JournalEntrySchema.ts（L197-338）の確認結果**:
- ✅ JournalEntry のすべてのプロパティが定義済み（19プロパティ + Phase 2用）
- ✅ JournalLine のすべてのプロパティが定義済み（16プロパティ + 追加）
- ✅ `vendorName` も定義済み（L121, L164）
- ✅ Draft/確定の2段階スキーマが存在
- ✅ `.strict()` モードで定義されている（ADR-011準拠）

**つまり、Zodスキーマは完璧です。問題は types/journal.ts だけです。**

---

## 📋 修正が必要なファイル

### ファイル1: `types/journal.ts` （完全書き換え）

**現状**: 14プロパティ、古い構造  
**目標**: Zodスキーマからの型推論に置き換える

### ファイル2: `types/client.ts` （Client型を拡張）

**現状**: types/firestore.ts からの再エクスポートのみ  
**目標**: 実装で必要なプロパティを追加

### ファイル3: `types/firestore.ts` （Client型を拡張）

**現状**: Client型に `id`, `taxMethod`, `isInvoiceRegistered` がない  
**目標**: 欠落しているプロパティを追加

### ファイル4: `FileTypeDetector.ts` （Partial削除）

**現状**: Partial<Client> を使用（ADR-011違反）  
**目標**: Pick<Client, ...> に変更

### ファイル5: `GeminiVisionService.ts` （Partial削除）

**現状**: Partial<Client> を使用（ADR-011違反）  
**目標**: Pick<Client, ...> に変更

---

## 🔧 設計案1: types/journal.ts の完全書き換え

### 現在のコード（14プロパティ、独自定義）

```typescript
// src/types/journal.ts L35-64（現在）
export interface JournalEntry {
  id: string;
  evidenceUrl?: string;
  evidenceId: string;
  lines: JournalLine[];
  totalAmount: number;
  balanceDiff: number;
  clientCode: string;
  status: JobStatus;
  consumptionTaxMode: 'general' | 'simplified' | 'exempt';
  simplifiedTaxCategory?: 1 | 2 | 3 | 4 | 5 | 6;
  transactionDate: Date;
  remandReason?: string;
  remandCount: number;
  updatedAt: Date;
}
```

### 新しい設計（Zodスキーマからの型推論）

```typescript
/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CRITICAL: AI TYPE SAFETY RULES - MUST FOLLOW WITHOUT EXCEPTION
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * 【型安全性ルール - AI必須遵守事項】
 *
 * ❌ 禁止事項（6項目）- NEVER DO THESE:
 * 1. Partial<T> + フォールバック値 (client.name || 'XXX') - TYPE CONTRACT DESTRUCTION
 * 2. any型（実装済み機能） - TYPE SYSTEM ABANDONMENT
 * 3. status フィールドの無視 - AUDIT TRAIL DESTRUCTION
 * 4. Zodスキーマでのany型 (z.any()) - SCHEMA LEVEL TYPE ABANDONMENT
 * 5. 型定義ファイルでのany型 (interface { field: any }) - INTERFACE LEVEL DESTRUCTION
 * 6. 型定義の二重管理（新旧スキーマ混在） - TYPE DEFINITION CONFLICT
 *
 * ✅ 許可事項（3項目）- ALLOWED:
 * 1. 将来のフェーズ未実装機能でのeslint-disable + throw new Error()
 * 2. unknown型の使用（型ガードと組み合わせて）
 * 3. 必要最小限の型定義（Pick<T>, Omit<T>等）
 *
 * 詳細: complete_evidence_no_cover_up.md
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * JournalEntry と JournalLine の型定義
 *
 * 重要: これらの型は JournalEntrySchema.ts の Zod スキーマから自動推論されます。
 * 型の定義を変更する場合は、JournalEntrySchema.ts を変更してください。
 *
 * ADR-011: 型定義の一元化
 * - Zodスキーマが唯一の真実（Single Source of Truth）
 * - TypeScript型はZodスキーマから推論
 * - 型定義の二重管理を防ぐ
 */

// JournalEntrySchema.ts からの型推論（再エクスポート）
export type {
  JournalEntry,
  JournalEntryDraft,
  JournalLine,
  JournalLineDraft,
  AISourceType,
  TaxType,
  TaxCode,
  InvoiceDeduction,
  TaxAmountSource,
  TaxDiscrepancySeverity,
  FileType,
} from '@/features/journal';

// バリデーション結果の型定義（Zodスキーマには含まれない、UI専用の型）
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  balanceDiff: number;
}
```

**変更のポイント**:
1. ✅ 独自の interface 定義を削除
2. ✅ Zodスキーマからの型推論を再エクスポート
3. ✅ ADR-011 コメントブロックを保持
4. ✅ ValidationResult のみ残す（UI専用の型）
5. ✅ 19プロパティすべてが自動的に含まれる

---

## 🔧 設計案2: types/client.ts の拡張

### 現在のコード

```typescript
// src/types/client.ts L1-11（現在）
import type { Client } from './firestore';

export type { Client };

export interface ClientUI extends Client {
  isActive: boolean;
  displayFiscalMonth: string;
}
```

### 新しい設計（変更不要、types/firestore.ts を修正）

```typescript
// src/types/client.ts（変更なし）
import type { Client } from './firestore';

export type { Client };

// UI向けの拡張型が必要な場合はここに追記
export interface ClientUI extends Client {
  // UI computed properties (optional)
  isActive: boolean;
  displayFiscalMonth: string;
}
```

**変更のポイント**:
- ✅ このファイルは変更不要
- ✅ types/firestore.ts の Client 型を修正する

---

## 🔧 設計案3: types/firestore.ts の Client 型拡張

### 現在のコード（L75-175、一部抜粋）

```typescript
// src/types/firestore.ts L75-175（現在）
export interface Client {
  /** Internal Symbol: CLIENT_CODE */
  clientCode: string;
  companyName: string;
  fiscalMonth: number;
  
  // ❌ 以下が存在しない:
  // - id
  // - taxMethod
  // - isInvoiceRegistered
  
  taxFilingType: TaxFilingType;
  consumptionTaxMode: ConsumptionTaxMode;
  defaultPaymentMethod?: 'cash' | 'owner_loan' | 'accounts_payable';
  calculationMethod?: 'accrual' | 'cash' | 'interim_cash';
  // ...
}
```

### 新しい設計（3プロパティ追加）

```typescript
// src/types/firestore.ts L75（修正後）
export interface Client {
  /** Document ID (Firestore auto-generated or clientCode) */
  id: string; // ← 追加

  /** Internal Symbol: CLIENT_CODE */
  clientCode: string;
  companyName: string;
  fiscalMonth: number;
  
  /** Tax calculation method: inclusive (税込) / exclusive (税抜) */
  taxMethod: 'inclusive' | 'exclusive'; // ← 追加
  
  /** Invoice registration status (インボイス登録の有無) */
  isInvoiceRegistered: boolean; // ← 追加
  
  // 既存のプロパティ
  taxFilingType: TaxFilingType;
  consumptionTaxMode: ConsumptionTaxMode;
  defaultPaymentMethod?: 'cash' | 'owner_loan' | 'accounts_payable';
  calculationMethod?: 'accrual' | 'cash' | 'interim_cash';
  // ...
}
```

**変更のポイント**:
1. ✅ `id: string` を追加（Firestoreのドキュメン トID）
2. ✅ `taxMethod: 'inclusive' | 'exclusive'` を追加
3. ✅ `isInvoiceRegistered: boolean` を追加
4. ✅ 既存のプロパティはそのまま

---

## 🔧 設計案4: FileTypeDetector.ts の Partial 削除

### 現在のコード（L23, L125）

```typescript
// src/services/ai/FileTypeDetector.ts L23（現在）
static buildPrompt(
  client: Pick<Client, 'id' | 'clientCode' | 'fiscalMonth' | 'taxMethod' | 'calculationMethod' | 'defaultPaymentMethod' | 'isInvoiceRegistered'>
): string {
  // ...
}

// L125（現在） ❌ ADR-011違反
private static calculatePeriod(client: Partial<Client>): { periodStart: string; periodEnd: string } {
  const fiscalMonth = client.fiscalMonth || 3; // ← フォールバック値
  // ...
}
```

### 新しい設計（Partial 削除）

```typescript
// src/services/ai/FileTypeDetector.ts L23（修正後）
static buildPrompt(
  client: Pick<Client, 'id' | 'clientCode' | 'fiscalMonth' | 'taxMethod' | 'calculationMethod' | 'defaultPaymentMethod' | 'isInvoiceRegistered'>
): string {
  // 既に Pick<Client, ...> を使用しているため、変更不要
}

// L125（修正後） ✅ ADR-011準拠
private static calculatePeriod(
  client: Pick<Client, 'fiscalMonth'> // ← Partial を削除
): { periodStart: string; periodEnd: string } {
  const fiscalMonth = client.fiscalMonth; // ← フォールバック削除
  const now = new Date();
  const year = now.getFullYear();

  // 期首月 = 決算月 + 1
  let startMonth = fiscalMonth + 1;
  let startYear = year;

  if (startMonth > 12) {
    startMonth = 1;
    startYear = year;
  } else {
    startYear = year - 1;
  }

  const periodStart = `${startYear}-${String(startMonth).padStart(2, '0')}-01`;
  const periodEnd = `${year}-${String(fiscalMonth).padStart(2, '0')}-31`;

  return { periodStart, periodEnd };
}
```

**変更のポイント**:
1. ✅ `Partial<Client>` を `Pick<Client, 'fiscalMonth'>` に変更
2. ✅ `client.fiscalMonth || 3` のフォールバック値を削除
3. ✅ fiscalMonth が必須になるため、型安全性が向上

---

## 🔧 設計案5: GeminiVisionService.ts の Partial 削除

### 現在のコード（L28, L120-121）

```typescript
// src/services/ai/GeminiVisionService.ts L28（現在） ❌ ADR-011違反
static async processFile(
  imageBase64: string,
  client: Partial<Client>, // ← Partial使用
  maxRetries: number = 3
)

// L120-121（現在） ❌ ADR-011違反
parsed.journalEntry.clientId = client.id || ''; // ← フォールバック値
parsed.journalEntry.clientCode = client.clientCode || ''; // ← フォールバック値
```

### 新しい設計（Partial 削除）

```typescript
// src/services/ai/GeminiVisionService.ts L28（修正後） ✅ ADR-011準拠
static async processFile(
  imageBase64: string,
  client: Pick<Client, 'id' | 'clientCode'>, // ← Partial を削除
  maxRetries: number = 3
): Promise<{
  fileType: FileType;
  journalEntry: JournalEntryDraft | null;
}> {
  // ...
}

// L120-121（修正後） ✅ ADR-011準拠
parsed.journalEntry.clientId = client.id; // ← フォールバック削除
parsed.journalEntry.clientCode = client.clientCode; // ← フォールバック削除
```

**変更のポイント**:
1. ✅ `Partial<Client>` を `Pick<Client, 'id' | 'clientCode'>` に変更
2. ✅ `client.id || ''` のフォールバック値を削除
3. ✅ `client.clientCode || ''` のフォールバック値を削除
4. ✅ id と clientCode が必須になるため、型安全性が向上

---

## 📊 変更の影響範囲

### 変更が必要なファイル（5ファイル）

| # | ファイル | 変更内容 | 難易度 | 所要時間 |
|---|---------|---------|-------|---------|
| 1 | `types/journal.ts` | 完全書き換え（Zodからの再エクスポート） | 低 | 5分 |
| 2 | `types/client.ts` | **変更不要** | - | 0分 |
| 3 | `types/firestore.ts` | Client型に3プロパティ追加 | 低 | 5分 |
| 4 | `FileTypeDetector.ts` | Partial削除（1箇所） | 低 | 5分 |
| 5 | `GeminiVisionService.ts` | Partial削除（2箇所） | 低 | 5分 |

**合計所要時間**: 20分

### 影響を受けるファイル（型エラー解消）

以下のファイルは修正後、自動的に型エラーが解消されます:

1. **CsvValidator.ts**
   - `entry.description` ✅ 型定義に追加される
   - `entry.date` ✅ 型定義に追加される
   - `line.vendorName` ✅ 型定義に追加される

2. **FileTypeDetector.ts**
   - `client.id` ✅ Client型に追加される
   - `client.taxMethod` ✅ Client型に追加される
   - `client.isInvoiceRegistered` ✅ Client型に追加される

3. **CsvExportService.ts**
   - `entry.date` ✅ 型定義に追加される
   - `entry.description` ✅ 型定義に追加される
   - `debitLine.vendorName` ✅ 型定義に追加される

4. **GeminiVisionService.ts**
   - `client.id` ✅ Client型に追加される
   - `client.clientCode` ✅ Client型に追加される

**追加の修正は不要です。**

---

## ✅ ADR-011 準拠の確認

### 禁止事項のチェック

| 禁止事項 | 現状 | 修正後 |
|---------|------|--------|
| 1. Partial<T> + フォールバック値 | ❌ 2箇所 | ✅ 0箇所 |
| 2. any型（実装済み機能） | ✅ 0箇所 | ✅ 0箇所 |
| 3. status フィールドの無視 | ✅ 使用中 | ✅ 使用中 |
| 4. Zodスキーマでのany型 | ✅ 0箇所 | ✅ 0箇所 |
| 5. 型定義ファイルでのany型 | ✅ 0箇所 | ✅ 0箇所 |
| 6. **型定義の二重管理** | **❌ 3箇所** | **✅ 1箇所（Zod が SSOT）** |

### 修正後の型定義管理

```
【修正前】型定義が3箇所に分散（二重管理の悪化版）
├─ types/journal.ts（独自定義、14プロパティ）
├─ types/firestore.ts（独自定義、異なる構造）
└─ JournalEntrySchema.ts（Zodスキーマ、19プロパティ）

↓ 修正

【修正後】Single Source of Truth（SSOT）
JournalEntrySchema.ts（Zodスキーマ）← **唯一の真実**
  ↓ 型推論
types/journal.ts（再エクスポートのみ）
```

**ADR-011 完全準拠**

---

## 🔍 検証計画

### Phase 3で実施する検証手順

1. **型チェック**
   ```bash
   npm run type-check
   ```
   → すべての型エラーが解消されることを確認

2. **ASTベースチェック**
   ```bash
   npm run type-check:ast
   ```
   → Partial<T>、any型が0箇所であることを確認

3. **Domain層厳格チェック**
   ```bash
   grep -r "Partial<\|:\s*any" src/domain src/features | grep -v "@type-audit"
   ```
   → 検出なしを確認

4. **影響範囲の確認**
   - CsvValidator.ts をビルド
   - FileTypeDetector.ts をビルド
   - CsvExportService.ts をビルド
   - GeminiVisionService.ts をビルド

---

## 📋 Phase 3実施計画

### Step 1: types/journal.ts の書き換え（5分）
1. 既存のコードを削除
2. 新しいコード（再エクスポート形式）を記述
3. 保存

### Step 2: types/firestore.ts の拡張（5分）
1. Client interface に `id`, `taxMethod`, `isInvoiceRegistered` を追加
2. コメントを追加
3. 保存

### Step 3: FileTypeDetector.ts の修正（5分）
1. L125 の `Partial<Client>` を `Pick<Client, 'fiscalMonth'>` に変更
2. L126 の `client.fiscalMonth || 3` を `client.fiscalMonth` に変更
3. 保存

### Step 4: GeminiVisionService.ts の修正（5分）
1. L28 の `Partial<Client>` を `Pick<Client, 'id' | 'clientCode'>` に変更
2. L120-121 のフォールバック値を削除
3. 保存

### Step 5: 検証（10分）
1. `npm run type-check` 実行
2. `npm run type-check:ast` 実行
3. すべてのエラーが解消されたことを確認

**合計所要時間**: 30分

---

## ⚠️ リスクと対策

### リスク1: ClientSchema.ts との不整合

**リスク**: ClientSchema.ts と types/firestore.ts の Client 型が一致しない

**対策**: 
- ClientSchema.ts は Draft/確定用の簡易版
- types/firestore.ts の Client 型が完全版
- 両者は別物として扱う（問題なし）

### リスク2: 呼び出し側でのclientデータ不足

**リスク**: FileTypeDetector.buildPrompt() や GeminiVisionService.processFile() を呼び出す側で、必須プロパティ（id, fiscalMonth等）が不足している

**対策**:
- 呼び出し側で型エラーが発生する
- 型エラーを修正することで、データの不足を事前に検知
- これは「型安全性の向上」であり、バグ防止になる

### リスク3: 既存のFirestoreデータとの不整合

**リスク**: 既存のFirestoreドキュメントに `id`, `taxMethod`, `isInvoiceRegistered` が存在しない

**対策**:
- `id` は Firestore のドキュメントIDを使用
- `taxMethod`, `isInvoiceRegistered` は optional にする
- または、デフォルト値を設定

**修正案**（安全策）:
```typescript
export interface Client {
  id: string; // Firestoreのドキュメ ントID
  taxMethod?: 'inclusive' | 'exclusive'; // optional
  isInvoiceRegistered?: boolean; // optional
  // ...
}
```

---

## ✋ Phase 2完了 - ユーザー承認待ち

**設計完了**:
- ✅ 修正が必要な型定義を特定
- ✅ 新しい型定義を設計
- ✅ Zodスキーマとの整合性確認
- ✅ ADR-011 準拠の確認
- ✅ 影響範囲の分析
- ✅ 検証計画の作成
- ✅ Phase 3実施計画の作成

**次のアクション**: ユーザーに承認を求める

**承認が必要な設計**:
1. types/journal.ts の完全書き換え（Zodからの再エクスポート）
2. types/firestore.ts の Client 型拡張（3プロパティ追加）
3. FileTypeDetector.ts の Partial 削除
4. GeminiVisionService.ts の Partial 削除
5. リスク対策（optional プロパティの追加）

**ユーザーの判断が必要な点**:
- Client型の新規プロパティを optional にするか、required にするか
- 実装を Phase 3 で進めるか、設計を修正するか

---

**End of Design Proposal**
