# TD-001: 型定義ミスマッチ - 完全調査レポート

**調査日**: 2026-01-24  
**調査者**: AI  
**ステータス**: Phase 1完了（変更は未実施）  
**重要**: **このレポートはすべての発見事項を隠蔽なく記録する**

---

## 📊 調査の結論

### **重大な発見**: 型定義は3つの異なる場所に分散している

1. **`types/journal.ts`**: UI用の `JournalEntry` 型定義（14プロパティ）
2. **`types/firestore.ts`**: Firestore用の `Job` 型定義 + `JournalLine` 型定義
3. **`step2_l1-3_definition.md`**: Step 2で決定された正式仕様（JournalEntry: 19プロパティ、JournalLine: 16プロパティ）

**結論**: これは「型定義の三重管理」であり、ADR-011で禁止されている **「型定義の二重管理（新旧スキーマ混在）」の悪化版**です。

---

## 🚨 Critical Issue 1: JournalEntry の不整合

### 正式仕様（step2_l1-3_definition.md）で定義された19プロパティ

```typescript
// step2_l1-3_definition.md L111-133
interface JournalEntry {
  1.  id: string (UUID)
  2.  date: string (YYYY-MM-DD)        ✅ ← 実装で使用
  3.  description: string              ✅ ← 実装で使用
  4.  totalAmount: number
  5.  lines: JournalLine[]
  6.  clientId: string
  7.  clientCode: string (3文字)
  8.  aiSourceType: enum
  9.  aiConfidence: number (0-1)
  10. sourceFiles: SourceFile[]
  11. createdAt: string (ISO)
  12. createdBy: string
  13. updatedAt: string (ISO)
  14. updatedBy: string
  15. isConfirmed: boolean
  16. hasQualifiedInvoice: boolean
  17. aiConfidenceBreakdown: object (Phase 2)
  18. exportHistory: object[] (Phase 2)
  19. approvalWorkflow: object (Phase 2)
}
```

### 既存の型定義（types/journal.ts）で定義された14プロパティ

```typescript
// src/types/journal.ts L35-64
export interface JournalEntry {
  id: string;
  evidenceUrl?: string;             // ❌ 正式仕様にない
  evidenceId: string;               // ❌ 正式仕様にない
  lines: JournalLine[];
  totalAmount: number;
  balanceDiff: number;              // ❌ 正式仕様にない
  clientCode: string;
  status: JobStatus;                // ❌ 正式仕様にない
  consumptionTaxMode: 'general' | 'simplified' | 'exempt'; // ❌ 正式仕様にない
  simplifiedTaxCategory?: 1 | 2 | 3 | 4 | 5 | 6; // ❌ 正式仕様にない
  transactionDate: Date;            // ❌ 正式仕様にない
  remandReason?: string;            // ❌ 正式仕様にない
  remandCount: number;              // ❌ 正式仕様にない
  updatedAt: Date;
  
  // ❌ 欠落している正式仕様のプロパティ:
  // date, description, clientId, aiSourceType, aiConfidence,
  // sourceFiles, createdAt, createdBy, updatedBy, isConfirmed,
  // hasQualifiedInvoice
}
```

### 実装で使用されているが型定義にないプロパティ

#### CsvValidator.ts (L25, L43)
```typescript
// L25: entry.description が存在しない
if (entry.description && entry.description.length > 200) { ... }

// L43: entry.date が存在しない
if (entry.date) { ... }
```

#### CsvExportService.ts (L47, L64)
```typescript
// L47: entry.date が存在しない
'取引日': entry.date.replace(/-/g, '/'),

// L64: entry.description が存在しない
'摘要': CsvValidator.truncateDescription(entry.description, 200),
```

---

## 🚨 Critical Issue 2: JournalLine の不整合

### 正式仕様（step2_l1-3_definition.md）で定義された16プロパティ

```typescript
// step2_l1-3_definition.md L149-168
interface JournalLine {
  1.  lineId: string (UUID)
  2.  accountCode: string
  3.  accountName: string
  4.  subAccount?: string
  5.  debit: number
  6.  credit: number
  7.  taxType: enum
  8.  taxAmountFromDocument: number
  9.  taxDocumentSource: enum
  10. taxAmountCalculated: number
  11. taxCalculationMethod: enum
  12. taxAmountFinal: number
  13. taxAmountSource: enum
  14. taxDiscrepancy: object
  15. description?: string
  16. isAIGenerated: boolean
  
  // ❌ 正式仕様には `vendorName` がない
}
```

### 既存の型定義（types/firestore.ts）で定義された JournalLine

```typescript
// src/types/firestore.ts L183-228
export interface JournalLine {
  lineNo: number;
  
  // 借方
  drAccount: string;
  drSubAccount?: string;
  drAmount: number;
  drTaxClass?: string;
  drTaxAmount?: number;
  
  // 貸方
  crAccount: string;
  crSubAccount?: string;
  crAmount: number;
  crTaxClass?: string;
  crTaxAmount?: number;
  
  description: string;
  departmentCode?: string;
  note?: string;
  invoiceIssuer?: InvoiceIssuerType;
  taxDetails?: { ... };
  isAutoMaster?: boolean;
  flags?: { ... };
  
  // ❌ 正式仕様にない `drAccount`, `crAccount`, `drAmount`, `crAmount`
  // ❌ 正式仕様の `debit`, `credit`, `accountCode`, `accountName` がない
}
```

### 実装で使用されているが型定義にないプロパティ

#### CsvValidator.ts (L34, L36)
```typescript
// L34-36: line.vendorName が存在しない
if (line.vendorName && line.vendorName.length > 50) { ... }
```

#### CsvExportService.ts (L51, L59)
```typescript
// L51: debitLine.vendorName が存在しない
'借方取引先': debitLine.vendorName || '',

// L59: creditLine.vendorName が存在しない
'貸方取引先': creditLine.vendorName || '',
```

---

## 🚨 Critical Issue 3: Client 型の不整合

### FileTypeDetector.ts (L23, L44-48)

```typescript
// L23: Pick<Client, ...> で必要なプロパティを抽出
client: Pick<Client, 'id' | 'clientCode' | 'fiscalMonth' | 'taxMethod' | 'calculationMethod' | 'defaultPaymentMethod' | 'isInvoiceRegistered'>

// L44-48: これらのプロパティが使用されている
client.clientCode  // ✅ types/firestore.ts に存在
client.fiscalMonth // ✅ types/firestore.ts に存在
client.taxMethod   // ❌ types/firestore.ts に存在しない
```

### types/firestore.ts の Client 型

```typescript
// src/types/firestore.ts L75-175
export interface Client {
  clientCode: string;
  companyName: string;
  fiscalMonth: number;
  
  // ❌ taxMethod というプロパティは存在しない
  // ❌ isInvoiceRegistered というプロパティは存在しない
  
  // 存在するのは:
  taxFilingType: TaxFilingType;
  consumptionTaxMode: ConsumptionTaxMode;
  defaultPaymentMethod?: 'cash' | 'owner_loan' | 'accounts_payable';
  calculationMethod?: 'accrual' | 'cash' | 'interim_cash';
}
```

### FileTypeDetector.ts (L125) の Partial<Client> 使用

```typescript
// L125: ❌ ADR-011で禁止されている Partial<Client> を使用
private static calculatePeriod(client: Partial<Client>): { ... } {
  const fiscalMonth = client.fiscalMonth || 3; // ❌ フォールバック値
}
```

**これは ADR-011 禁止事項#1「Partial<T> + フォールバック値」の典型例です。**

---

## 🚨 Critical Issue 4: Partial<Client> による型契約破壊

### GeminiVisionService.ts (L28, L120-121)

```typescript
// L28: ❌ Partial<Client> を使用
static async processFile(
  imageBase64: string,
  client: Partial<Client>,  // ← 型契約を骨抜きに
  maxRetries: number = 3
)

// L120-121: フォールバック値を使用
parsed.journalEntry.clientId = client.id || '';       // ❌
parsed.journalEntry.clientCode = client.clientCode || ''; // ❌
```

**これは ADR-011 禁止事項#1「Partial<T> + フォールバック値」の典型例です。**

---

## 📋 差分マトリックス

### JournalEntry プロパティ差分表

| プロパティ | 正式仕様 | types/journal.ts | 実装使用 | 状態 |
|-----------|---------|-----------------|---------|------|
| `id` | ✅ Phase1 | ✅ | ✅ | OK |
| **`date`** | **✅ Phase1** | **❌** | **✅** | **不整合** |
| **`description`** | **✅ Phase1** | **❌** | **✅** | **不整合** |
| `totalAmount` | ✅ Phase1 | ✅ | ✅ | OK |
| `lines` | ✅ Phase1 | ✅ | ✅ | OK |
| `clientId` | ✅ Phase1 | ❌ | ✅ | 不整合 |
| `clientCode` | ✅ Phase1 | ✅ | ✅ | OK |
| `aiSourceType` | ✅ Phase1 | ❌ | ✅ | 不整合 |
| `aiConfidence` | ✅ Phase1 | ❌ | ✅ | 不整合 |
| `sourceFiles` | ✅ Phase1 | ❌ | ⭕ | 不整合 |
| `createdAt` | ✅ Phase1 | ❌ | ✅ | 不整合 |
| `createdBy` | ✅ Phase1 | ❌ | ✅ | 不整合 |
| `updatedAt` | ✅ Phase1 | ✅ | ✅ | OK |
| `updatedBy` | ⭕ Phase1 | ❌ | ⭕ | 不整合 |
| `isConfirmed` | ✅ Phase1 | ❌ | ⭕ | 不整合 |
| `hasQualifiedInvoice` | ⭕ Phase1 | ❌ | ⭕ | 不整合 |
| `evidenceUrl` | ❌ | ✅ | ❌ | 不要 |
| `evidenceId` | ❌ | ✅ | ❌ | 不要 |
| `balanceDiff` | ❌ | ✅ | ❌ | 不要 |
| `status` | ❌ | ✅ | ❌ | 不要 |
| `consumptionTaxMode` | ❌ | ✅ | ❌ | 不要 |
| `simplifiedTaxCategory` | ❌ | ✅ | ❌ | 不要 |
| `transactionDate` | ❌ | ✅ | ❌ | 不要 |
| `remandReason` | ❌ | ✅ | ❌ | 不要 |
| `remandCount` | ❌ | ✅ | ❌ | 不要 |

### JournalLine プロパティ差分表

| プロパティ | 正式仕様 | types/firestore.ts | 実装使用 | 状態 |
|-----------|---------|-------------------|---------|------|
| `lineId` | ✅ Phase1 | ❌ | ✅ | 不整合 |
| `accountCode` | ✅ Phase1 | ❌ | ✅ | 不整合 |
| `accountName` | ✅ Phase1 | ❌ | ✅ | 不整合 |
| `subAccount` | ⭕ Phase1 | ✅ (drSubAccount/crSubAccount) | ✅ | OK |
| `debit` | ✅ Phase1 | ❌ | ✅ | 不整合 |
| `credit` | ✅ Phase1 | ❌ | ✅ | 不整合 |
| `taxType` | ✅ Phase1 | ❌ | ✅ | 不整合 |
| **`vendorName`** | **❌ 正式仕様にない** | **❌** | **✅ 実装で使用** | **追加が必要** |
| `taxAmountFromDocument` | ⭕ Phase1 | ❌ | ✅ | 不整合 |
| `taxAmountCalculated` | ✅ Phase1 | ❌ | ✅ | 不整合 |
| `taxAmountFinal` | ✅ Phase1 | ❌ | ✅ | 不整合 |
| `isAIGenerated` | ✅ Phase1 | ❌ | ✅ | 不整合 |

### Client プロパティ差分表

| プロパティ | types/firestore.ts | 実装使用 | 状態 |
|-----------|-------------------|---------|------|
| `id` | ❌ | ✅ | **不整合** |
| `clientCode` | ✅ | ✅ | OK |
| `fiscalMonth` | ✅ | ✅ | OK |
| `taxMethod` | ❌ | ✅ | **不整合** |
| `calculationMethod` | ✅ | ✅ | OK |
| `defaultPaymentMethod` | ✅ | ✅ | OK |
| `isInvoiceRegistered` | ❌ | ✅ | **不整合** |

---

## 📊 影響箇所の完全リスト

### ❌ 型エラーが発生している箇所

1. **CsvValidator.ts**
   - L25: `entry.description` （JournalEntry型に存在しない）
   - L34: `line.vendorName` （JournalLine型に存在しない）
   - L43: `entry.date` （JournalEntry型に存在しない）

2. **FileTypeDetector.ts**
   - L23: `Pick<Client, 'id' | 'taxMethod' | 'isInvoiceRegistered'>` （Client型に存在しない）
   - L44-48: `client.taxMethod`, `client.isInvoiceRegistered` の使用
   - L125: `Partial<Client>` の使用（ADR-011違反）

3. **CsvExportService.ts**
   - L47: `entry.date` （JournalEntry型に存在しない）
   - L51: `debitLine.vendorName` （JournalLine型に存在しない）
   - L59: `creditLine.vendorName` （JournalLine型に存在しない）
   - L64: `entry.description` （JournalEntry型に存在しない）

4. **GeminiVisionService.ts**
   - L28: `Partial<Client>` の使用（ADR-011違反）
   - L120-121: `client.id || ''`, `client.clientCode || ''` （ADR-011違反）

---

## 🎯 Phase 2で実施すべき修正（優先順位順）

### 優先度1（最高）: 型定義の一元化

#### 目標: 型定義を1箇所に統一する

**Option A（推奨）**: `step2_l1-3_definition.md` の仕様を `types/journal.ts` に正確に実装する

```typescript
// types/journal.ts を完全に書き直す
export interface JournalEntry {
  // 正式仕様の19プロパティをすべて含める
  id: string;
  date: string; // ← 追加
  description: string; // ← 追加
  totalAmount: number;
  lines: JournalLine[];
  clientId: string; // ← 追加
  clientCode: string;
  aiSourceType: 'gemini' | 'manual' | 'hybrid'; // ← 追加
  aiConfidence: number; // ← 追加
  sourceFiles: SourceFile[]; // ← 追加
  createdAt: string; // ← 追加
  createdBy: string; // ← 追加
  updatedAt: string;
  updatedBy?: string; // ← 追加
  isConfirmed: boolean; // ← 追加
  hasQualifiedInvoice?: boolean; // ← 追加
  // Phase 2用
  aiConfidenceBreakdown?: object;
  exportHistory?: object[];
  approvalWorkflow?: object;
}

export interface JournalLine {
  lineId: string;
  accountCode: string;
  accountName: string;
  subAccount?: string;
  debit: number; // ← 追加
  credit: number; // ← 追加
  taxType: TaxType; // ← 追加
  vendorName?: string; // ← 追加（正式仕様にないが実装で必要）
  vendorNameRaw?: string; // ← 追加
  taxCode?: string; // ← 追加
  invoiceDeduction?: string; // ← 追加
  taxAmountFromDocument?: number; // ← 追加
  taxDocumentSource?: string; // ← 追加
  taxAmountCalculated: number; // ← 追加
  taxCalculationMethod?: string; // ← 追加
  taxAmountFinal: number; // ← 追加
  taxAmountSource?: string; // ← 追加
  taxDiscrepancy?: object; // ← 追加
  description?: string; // ← 追加
  isAIGenerated: boolean; // ← 追加
}
```

**Option B**: `types/firestore.ts` の `Job` および `JournalLine` を正式仕様に合わせる

### 優先度2: Client型の修正

```typescript
// types/firestore.ts L75-175 を修正
export interface Client {
  id: string; // ← 追加
  clientCode: string;
  // ...
  fiscalMonth: number;
  taxMethod: 'inclusive' | 'exclusive'; // ← 追加
  isInvoiceRegistered: boolean; // ← 追加
  // ...
}
```

### 優先度3: Partial<Client> の削除

```typescript
// FileTypeDetector.ts L125 を修正
private static calculatePeriod(
  client: Pick<Client, 'fiscalMonth'> // ← Partial を削除
): { periodStart: string; periodEnd: string } {
  const fiscalMonth = client.fiscalMonth; // ← フォールバック削除
  // ...
}

// GeminiVisionService.ts L28 を修正
static async processFile(
  imageBase64: string,
  client: Pick<Client, 'id' | 'clientCode'>, // ← Partial を削除
  maxRetries: number = 3
)

// L120-121 を修正
parsed.journalEntry.clientId = client.id; // ← フォールバック削除
parsed.journalEntry.clientCode = client.clientCode; // ← フォールバック削除
```

---

## 🔍 根本原因分析

### なぜこの問題が発生したのか？

1. **Step 2で正式仕様を作成したが、既存の型定義ファイルを確認しなかった**
   - `step2_l1-3_definition.md` で19プロパティを決定
   - 既存の `types/journal.ts` は14プロパティのまま

2. **Step 3で実装を急ぎすぎた**
   - `entry.date`, `entry.description` を使用したが、型定義を確認しなかった
   - ESLintエラーを無視して実装を進めた

3. **型定義が3箇所に分散している**
   - `types/journal.ts` （UI用）
   - `types/firestore.ts` （Firestore用）
   - `step2_l1-3_definition.md` （正式仕様）

4. **Partial<T> を安易に使用した**
   - 型エラーを回避するために `Partial<Client>` を使用
   - ADR-011違反

---

## 📝 Phase 2実施計画（概要）

### Step 1: 型定義の一元化（30分）
1. `types/journal.ts` を正式仕様に合わせて完全に書き直す
2. `types/firestore.ts` との整合性を確認
3. Zodスキーマ（JournalEntrySchema.ts）を更新

### Step 2: Client型の修正（15分）
1. `types/firestore.ts` に `id`, `taxMethod`, `isInvoiceRegistered` を追加
2. すべての Client 型使用箇所を確認

### Step 3: Partial<Client> の削除（20分）
1. `FileTypeDetector.ts` の `Partial<Client>` を `Pick<Client, ...>` に変更
2. `GeminiVisionService.ts` の `Partial<Client>` を `Pick<Client, ...>` に変更
3. フォールバック値を削除

### Step 4: 検証（15分）
1. `npm run type-check` を実行
2. `npm run type-check:ast` を実行
3. すべての型エラーが解消されたことを確認

---

## ✅ Phase 1調査の完了確認

- [x] 既存型定義ファイルを確認（types/journal.ts、types/firestore.ts、types/client.ts）
- [x] 正式仕様を確認（step2_l1-3_definition.md）
- [x] 実装コードを確認（CsvValidator、FileTypeDetector、CsvExportService、GeminiVisionService）
- [x] 差分マトリックスを作成
- [x] 影響箇所の完全リストを作成
- [x] 根本原因分析を実施
- [x] Phase 2実施計画を作成

**Phase 1調査は完了しました。すべての発見事項を隠蔽なく記録しました。**

**Phase 2の承認を待ちます。**

---

**End of Report**
