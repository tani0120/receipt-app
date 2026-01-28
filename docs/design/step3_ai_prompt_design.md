<!-- ═══════════════════════════════════════════════════════════════════════════ -->
<!-- CRITICAL: AI TYPE SAFETY RULES - MUST FOLLOW WITHOUT EXCEPTION             -->
<!-- ═══════════════════════════════════════════════════════════════════════════ -->
<!-- 
【型安全性ルール - AI必須遵守事項】

## ❌ 禁止事項（6項目）- NEVER DO THESE:
1. Partial<T> + フォールバック値 (client.name || 'XXX') - TYPE CONTRACT DESTRUCTION
2. any型（実装済み機能） - TYPE SYSTEM ABANDONMENT
3. status フィールドの無視 - AUDIT TRAIL DESTRUCTION
4. Zodスキーマでのany型 (z.any()) - SCHEMA LEVEL TYPE ABANDONMENT
5. 型定義ファイルでのany型 (interface { field: any }) - INTERFACE LEVEL DESTRUCTION
6. 型定義の二重管理（新旧スキーマ混在） - TYPE DEFINITION CONFLICT

## ✅ 許可事項（3項目）- ALLOWED:
1. 将来のフェーズ未実装機能でのeslint-disable + throw new Error()
2. unknown型の使用（型ガードと組み合わせて）
3. 必要最小限の型定義（Pick<T>, Omit<T>等）

## 📋 類型分類（9種）:
| 類型 | 今すぐ修正 | 将来Phase | 修正不要 |
|------|-----------|----------|---------|
| 1. Partial+フォールバック | ✅ | - | - |
| 2. any型（実装済み） | ✅ | - | - |
| 3. status未使用 | ✅ | - | - |
| 4. eslint-disable | - | - | ✅ |
| 5. Zod.strict()偽装 | ※1+2 | - | - |
| 6. Zodスキーマany型 | ✅ | - | - |
| 7. 型定義any型 | ✅ | - | - |
| 8. 全体any型濫用 | - | ✅ | - |
| 9. 型定義不整合 | ✅ | - | - |

詳細: complete_evidence_no_cover_up.md

## ⚠️ MANDATORY: このルールブロックの保持義務
THIS RULE BLOCK MUST REMAIN AT THE TOP OF THIS FILE AT ALL TIMES.
UNDER NO CIRCUMSTANCES SHALL ANY AI EDIT THIS FILE WITHOUT PRESERVING THIS BLOCK.
WHEN EDITING THIS FILE, YOU MUST:
1. NEVER remove this rule block
2. NEVER move this rule block from the top position
3. ALWAYS ensure this block is the first content in the file
4. IMMEDIATELY restore this block if it is accidentally removed

VIOLATION OF THIS REQUIREMENT IS A CRITICAL FAILURE.
このルールブロックをファイルの最上部から削除・移動することは、
型安全性破壊と同等の重大な違反行為である。
-->
<!-- ═══════════════════════════════════════════════════════════════════════════ -->

# Step 3: AI API実装（Gemini Vision API）- 最終版

**作成日**: 2026-01-23  
**最終改訂**: 2026-01-24  
**所要時間**: 4-5時間  
**ステータス**: 実装待ち  
**改訂理由**: 会計ソフトの詳細情報（税区分マッピング、CSV物理制約、NFKC正規化）を反映

---

## 🎯 Phase 1での実装方針（重要）

### **MF 1つでも、以下は必須**

| 項目 | Phase 1実装 | 理由 |
|------|------------|------|
| **NFKC正規化** | ✅ 必須 | MFの取引先マスタ連動に必須 |
| **税区分マッピング** | ✅ 必須（MFのみ） | MF形式のCSV出力に必須 |
| **CSV物理制約** | ✅ 必須 | 摘要200文字、Shift-JIS変換 |
| **インボイス80%** | ✅ 必須（固定値） | 2026年9月30日まで |

**Phase 1で実装しなければ、MFへのCSV出力が動作しません。**

---

## 📋 改訂の全体方針（7項目）

1. **AIによるファイル形式自動判定** ✅
2. **Draft/確定の2段階スキ ーマ**（L1-3準拠） ✅
3. **NFKC正規化処理**（Phase 1必須） ✅
4. **税区分マッピング**（Phase 1: MFのみ） ✅
5. **CSV物理制約チェック**（Phase 1: MFのみ） ✅
6. **顧問先情報10プロパティ活用** ✅
7. **プロンプトのモジュール化** ✅

---

# 1. スキーマ設計（L1-3準拠）

## 1-1. Draft/確定の2段階スキーマ

### JournalEntryDraftSchema（OCR直後）

```typescript
export const JournalEntryDraftSchema = z.object({
  // 基本情報
  id: z.string().uuid(),
  status: z.literal("Draft"),  // ← L1-3準拠
  
  // optional許可（AIが抽出できない場合がある）
  date: z.string().optional(),
  description: z.string().optional(),
  totalAmount: z.number().optional(),
  
  // 明細行（最小1行、Draft時）
  lines: z.array(JournalLineDraftSchema).min(1),
  
  // AI情報（必須）
  aiSourceType: z.enum(['gemini', 'manual', 'hybrid']),
  aiConfidence: z.number().min(0).max(1),
  
  // 顧問先情報（必須）
  clientId: z.string(),
  clientCode: z.string(),
  
  // その他はoptional
  duplicateCheckHash: z.string().optional(),
  sourceFiles: z.array(...).optional(),
  
  createdAt: z.string(),
  createdBy: z.string(),
  updatedAt: z.string(),
  updatedBy: z.string().optional(),
}).strict();
```

### JournalEntrySchema（確認後）

```typescript
export const JournalEntrySchema = z.object({
  // 基本情報
  id: z.string().uuid(),
  status: z.enum(["Submitted", "Approved"]),  // ← L1-3準拠
  
  // optional禁止（すべて必須）
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  description: z.string().min(1),
  totalAmount: z.number().min(0),
  
  // 明細行（最小2行、確定時）
  lines: z.array(JournalLineSchema).min(2),
  
  // 重複検知（必須）
  duplicateCheckHash: z.string(),
  
  // ... すべて必須
}).strict();
```

---

## 1-2. JournalLineSchema（拡張版）

### 追加プロパティ

```typescript
export const JournalLineSchema = z.object({
  // ========== 既存フィールド ==========
  lineId: z.string().uuid(),
  accountCode: z.string(),
  accountName: z.string(),
  debit: z.number().min(0),
  credit: z.number().min(0),
  
  // ========== 追加1: 取引先（Phase 1必須） ==========
  vendorNameRaw: z.string().optional().describe('正規化前の取引先名（例: "カ)ABC シヤ"）'),
  vendorName: z.string().optional().describe('正規化後の取引先名（例: "ABC"）'),
  
  // ========== 追加2: 税区分（Phase 1必須） ==========
  taxCode: z.enum([
    // 売上
    'TAXABLE_SALES_10',           // 課税売上10%
    'TAXABLE_SALES_REDUCED_8',    // 課税売上8%(軽)
    'NON_TAXABLE_SALES',          // 非課税売上
    'OUT_OF_SCOPE_SALES',         // 対象外売上
    
    // 仕入
    'TAXABLE_PURCHASE_10',        // 課税仕入10%
    'TAXABLE_PURCHASE_REDUCED_8', // 課税仕入8%(軽)
    'COMMON_TAXABLE_PURCHASE_10', // 共通課税仕入10%
    'NON_TAXABLE_PURCHASE',       // 非課税仕入
    'OUT_OF_SCOPE_PURCHASE',      // 対象外(仕入)
    
    // 特殊
    'REVERSE_CHARGE',             // リバースチャージ
    'IMPORT_TAX',                 // 輸入消費税
  ]),
  
  // ========== 追加3: インボイス区分（Phase 1: 80%固定） ==========
  invoiceDeduction: z.enum([
    'QUALIFIED',        // 適格請求書（100%控除）
    'DEDUCTION_80',     // 80%控除（～2026/09/30）
    'DEDUCTION_70',     // 70%控除（2026/10/01～2028/09/30）Phase 2
    'DEDUCTION_50',     // 50%控除（2028/10/01～2030/09/30）Phase 2
    'DEDUCTION_30',     // 30%控除（2030/10/01～2031/09/30）Phase 2
    'DEDUCTION_NONE',   // 控除不可
  ]).optional().default('QUALIFIED'),
  
  // ========== 税額情報（既存） ==========
  taxAmountFromDocument: z.number().min(0).optional(),
  taxAmountCalculated: z.number().min(0),
  taxAmountFinal: z.number().min(0),
  
  // ========== その他 ==========
  description: z.string().optional(),
  isAIGenerated: z.boolean(),
  isOutOfPeriod: z.boolean().optional(),
  outOfPeriodReason: z.string().optional(),
}).strict();
```

---

# 2. 正規化処理（Phase 1必須）

##

 2-1. NormalizationService

```typescript
/**
 * NFKC正規化 + 法人格除去
 * 
 * 目的: MF取引先マスタとの連動（重複登録防止）
 */
export class NormalizationService {
  
  /**
   * 取引先名の正規化
   * 
   * 入力: "カ)ABC シヤ"
   * 出力: "ABC"
   */
  static normalizeVendorName(rawName: string): string {
    // 1. NFKC正規化（全角英数→半角、半角カナ→全角）
    const nfkc = rawName.normalize('NFKC');
    
    // 2. 法人格除去
    const cleaned = nfkc
      .replace(/カ\)/g, '')
      .replace(/\(株\)/g, '')
      .replace(/（株）/g, '')
      .replace(/㈱/g, '')
      .replace(/株式会社/g, '')
      .replace(/シヤ$/g, '')
      .replace(/有限会社/g, '')
      .replace(/合同会社/g, '')
      .replace(/合資会社/g, '')
      .replace(/合名会社/g, '')
      .trim();
    
    return cleaned;
  }
  
  /**
   * 摘要の正規化
   */
  static normalizeDescription(raw: string): string {
    // NFKC正規化のみ（法人格は残す）
    return raw.normalize('NFKC').trim();
  }
  
  /**
   * 全角/半角統一
   */
  static normalizeNumbers(raw: string): string {
    // 全角数字 → 半角数字
    return raw.replace(/[０-９]/g, (s) => 
      String.fromCharCode(s.charCodeAt(0) - 0xFEE0)
    );
  }
}
```

---

# 3. 税区分マッピング（Phase 1: MFのみ）

## 3-1. TaxCodeMapper

```typescript
/**
 * 税区分の内部コード → 会計ソフト別形式への変換
 * 
 * Phase 1: MFのみ実装
 * Phase 2: Freee、弥生を追加
 */
export class TaxCodeMapper {
  
  /**
   * MF形式に変換
   */
  static toMF(
    internalCode: string,
    invoiceDeduction?: string
  ): { taxCode: string; invoiceFlag: string } {
    
    const taxMapping: Record<string, string> = {
      // 売上
      'TAXABLE_SALES_10': '課売 10%',
      'TAXABLE_SALES_REDUCED_8': '課売 (軽)8%',
      'NON_TAXABLE_SALES': '非売',
      'OUT_OF_SCOPE_SALES': '対象外売',
      
      // 仕入
      'TAXABLE_PURCHASE_10': '課仕 10%',
      'TAXABLE_PURCHASE_REDUCED_8': '課仕 (軽)8%',
      'COMMON_TAXABLE_PURCHASE_10': '共-課仕 10%',
      'NON_TAXABLE_PURCHASE': '非仕',
      'OUT_OF_SCOPE_PURCHASE': '対象外',
    };
    
    const invoiceMapping: Record<string, string> = {
      'QUALIFIED': '适格',
      'DEDUCTION_80': '80%控除',
      'DEDUCTION_70': '70%控除',  // Phase 2
      'DEDUCTION_50': '50%控除',  // Phase 2
      'DEDUCTION_30': '30%控除',  // Phase 2
      'DEDUCTION_NONE': '控除不可',
    };
    
    return {
      taxCode: taxMapping[internalCode] || '',
      invoiceFlag: invoiceMapping[invoiceDeduction || 'QUALIFIED'] || ''
    };
  }
  
  /**
   * Phase 2: Freee形式に変換
   */
  static toFreee(internalCode: string): string {
    // Phase 2で実装
    throw new Error('Phase 2で実装予定');
  }
  
  /**
   * Phase 2: 弥生形式に変換
   */
  static toYayoi(internalCode: string): string {
    // Phase 2で実装
    throw new Error('Phase 2で実装予定');
  }
}
```

---

# 4. CSV出力（Phase 1: MFのみ）

## 4-1. CsvExportService

```typescript
/**
 * MF クラウド用CSV出力
 * 
 * Phase 1: MFのみ実装
 */
export class CsvExportService {
  
  static async exportToMF(
    journalEntries: JournalEntry[],
    client: Client
  ): Promise<Blob> {
    
    const rows = journalEntries.flatMap(entry => {
      // 複合仕訳の場合、各行をCSV行に変換
      const debitLines = entry.lines.filter(l => l.debit > 0);
      const creditLines = entry.lines.filter(l => l.credit > 0);
      
      return debitLines.flatMap(debitLine => {
        return creditLines.map(creditLine => {
          const { taxCode: debitTax, invoiceFlag: debitInvoice } = 
            TaxCodeMapper.toMF(debitLine.taxCode, debitLine.invoiceDeduction);
          const { taxCode: creditTax, invoiceFlag: creditInvoice } = 
            TaxCodeMapper.toMF(creditLine.taxCode, creditLine.invoiceDeduction);
          
          return {
            '取引No': entry.id,
            '取引日': entry.date.replace(/-/g, '/'),  // YYYY/MM/DD
            '借方勘定科目': debitLine.accountName,
            '借方補助科目': '',
            '借方部門': '',
            '借方取引先': debitLine.vendorName || '',  // ← 正規化済み
            '借方税区分': debitTax,
            '借方インボイス': debitInvoice,
            '借方金額(円)': debitLine.debit,
            '借方税額': 0,  // 税込経理なので0
            '貸方勘定科目': creditLine.accountName,
            '貸方補助科目': '',
            '貸方部門': '',
            '貸方取引先': creditLine.vendorName || '',
            '貸方税区分': creditTax,
            '貸方インボイス': creditInvoice,
            '貸方金額(円)': creditLine.credit,
            '貸方税額': 0,
            '摘要': CsvValidator.truncateDescription(entry.description, 200),
            '仕訳メモ': 'AI Accounting System',
            'タグ': '',
            'MF仕訳タイプ': 'インポート',
            '決算整理仕訳': '',
            '作成日時': new Date().toISOString(),
            '作成者': 'System_Core',
            '最終更新日時': new Date().toISOString(),
            '最終更新者': 'System_Core',
          };
        });
      });
    });
    
    // CSV文字列に変換
    const csvContent = convertToCSV(rows);
    
    // Shift-JIS変換（MF必須）
    const csvBuffer = iconv.encode(csvContent, 'Shift_JIS');
    
    return new Blob([csvBuffer], { type: 'text/csv; charset=Shift-JIS' });
  }
}
```

## 4-2. CsvValidator

```typescript
/**
 * CSV物理制約チェック
 * 
 * Phase 1: MFのみ実装
 */
export class CsvValidator {
  
  /**
   * MF の制約チェック
   */
  static validateMF(entry: JournalEntry): void {
    // 1. 摘要欄: 全角200文字以内
    if (entry.description.length > 200) {
      throw new Error(`摘要欄は全角200文字以内（現在: ${entry.description.length}文字）`);
    }
    
    // 2. 取引先: 全角50文字以内
    entry.lines.forEach(line => {
      if (line.vendorName && line.vendorName.length > 50) {
        throw new Error(`取引先は全角50文字以内（現在: ${line.vendorName.length}文字）`);
      }
    });
    
    // 3. 日付: YYYY/MM/DD形式
    if (!/^\d{4}\/\d{2}\/\d{2}$/.test(entry.date.replace(/-/g, '/'))) {
      throw new Error(`日付形式が不正: ${entry.date}`);
    }
  }
  
  /**
   * 摘要欄を指定文字数に切り詰め
   */
  static truncateDescription(description: string, maxLength: number): string {
    if (description.length <= maxLength) {
      return description;
    }
    return description.substring(0, maxLength - 3) + '...';
  }
}
```

---

# 5. AI処理（Gemini Vision API）

## 5-1. ファイル形式自動判定

```typescript
/**
 * ファイル形式を自動判定 + 仕訳生成
 * 
 * 1回のAPI呼び出しで両方を実施
 */
export class GeminiVisionService {
  
  static async processFile(
    imageBase64: string,
    client: Client
  ): Promise<{
    fileType: FileType;
    journalEntry: JournalEntryDraft | null;
  }> {
    
    // 1. ファイル形式判定 + 仕訳生成のプロンプト
    const prompt = FileTypeDetector.buildPrompt(client);
    
    // 2. Gemini Vision API呼び出し
    const response = await fetch(process.env.GEMINI_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GEMINI_API_KEY}`
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { inline_data: { mime_type: 'image/jpeg', data: imageBase64 } }
          ]
        }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 4096
        }
      })
    });
    
    const result = await response.json();
    const jsonText = result.candidates[0].content.parts[0].text;
    const cleanedJson = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleanedJson);
    
    // 3. ファイル形式を確認
    if (parsed.fileType === 'OTHER_NON_JOURNAL') {
      // 仕訳に関係しない → null返す
      return {
        fileType: 'OTHER_NON_JOURNAL',
        journalEntry: null
      };
    }
    
    // 4. 仕訳データを正規化
    if (parsed.journalEntry) {
      parsed.journalEntry.lines.forEach(line => {
        if (line.vendorNameRaw) {
          line.vendorName = NormalizationService.normalizeVendorName(line.vendorNameRaw);
        }
      });
      
      // 重複検知ハッシュ生成
      parsed.journalEntry.duplicateCheckHash = 
        JournalSemanticGuard.generateDuplicateHash(parsed.journalEntry);
    }
    
    // 5. スキーマ検証
    const validated = JournalEntryDraftSchema.parse(parsed.journalEntry);
    
    return {
      fileType: parsed.fileType,
      journalEntry: validated
    };
  }
}
```

## 5-2. FileTypeDetector

```typescript
/**
 * ファイル形式判定用プロンプト
 */
export class FileTypeDetector {
  
  static buildPrompt(client: Client): string {
    return `
【タスク1: ファイル形式判定】
このファイルの種類を判定してください:
- RECEIPT: 領収書
- INVOICE: 請求書
- BANK_CSV: 通帳CSV
- BANK_IMAGE: 通帳画像
- CREDIT_CSV: クレカ明細CSV
- CREDIT_IMAGE: クレカ明細画像
- OTHER_JOURNAL: その他（仕訳関連）
- OTHER_NON_JOURNAL: その他（仕訳無関係）

【タスク2: 仕訳データ生成】
（ファイル形式がOTHER_NON_JOURNAL以外の場合）

顧問先情報:
- 決算月: ${client.fiscalMonth}月
- 会計方式: ${client.taxMethod}
- インボイス登録: ${client.isInvoiceRegistered ? 'あり' : 'なし'}

仕訳データを生成してください。

【重要】
- 取引先名を抽出した場合、vendorNameRaw に設定
- 税区分は以下の中間コードを使用:
  - TAXABLE_PURCHASE_10（課税仕入10%）
  - TAXABLE_SALES_10（課税売上10%）
  等
  
【出力例】
{
  "fileType": "RECEIPT",
  "journalEntry": {
    "date": "2026-01-23",
    "description": "ABC ストア 事務用品",
    "lines": [
      {
        "accountName": "消耗品費",
        "debit": 1100,
        "credit": 0,
        "vendorNameRaw": "カ)ABC シヤ",
        "taxCode": "TAXABLE_PURCHASE_10",
        "invoiceDeduction": "QUALIFIED"
      },
      {
        "accountName": "現金",
        "debit": 0,
        "credit": 1100,
        "taxCode": "OUT_OF_SCOPE_PURCHASE"
      }
    ]
  }
}
`;
  }
}
```

---

# 6. 実装ファイル一覧（Phase 1）

| ファイル | 役割 | 実装優先度 |
|---------|------|-----------|
| `JournalEntrySchema.ts` | Draft/確定スキーマ | **最高** |
| `JournalLineSchema.ts` | 明細行スキーマ（拡張版） | **最高** |
| `NormalizationService.ts` | NFKC正規化 + 法人格除去 | **最高** |
| `TaxCodeMapper.ts` | 税区分マッピング（MFのみ） | **最高** |
| `CsvExportService.ts` | MF用CSV出力 | **最高** |
| `CsvValidator.ts` | CSV物理制約チェック | **最高** |
| `GeminiVisionService.ts` | AI処理 | **最高** |
| `FileTypeDetector.ts` | ファイル形式判定 | **高** |
| `PromptTemplates.ts` | プロンプトモジュール化 | 中 |

---

# 7. テストケース

## 7-1. 正規化テスト

**入力**: `"カ)ABC シヤ"`  
**期待出力**: `"ABC"`

**入力**: `"（株）XYZ商事"`  
**期待出力**: `"XYZ商事"`

## 7-2. 税区分マッピングテスト

**入力**: `internalCode = 'TAXABLE_PURCHASE_10'`, `invoiceDeduction = 'QUALIFIED'`  
**期待出力**: `{ taxCode: '課仕 10%', invoiceFlag: '適格' }`

## 7-3. CSV制約テスト

**テスト1**: 摘要欄201文字 → エラー  
**テスト2**: 取引先51文字 → エラー  
**テスト3**: 摘要欄200文字 → OK

---

# 8. Phase 2への拡張予定

## 8-1. マスタAPI連携

**Freee**: REST API (OAuth 2.1)
```typescript
// Tax Codeの動的取得
const taxes = await freeeApi.getTaxes(companyId);
```

**MF**: REST API (OAuth 2.1)
```typescript
// 補助科目の動的取得
const subAccounts = await mfApi.getSubAccounts();
```

## 8-2. インボイス経過措置スケジュール

| 期間 | 控除率 | 実装フェーズ |
|------|--------|-------------|
| ～2026/09/30 | 80% | **Phase 1** |
| 2026/10/01～2028/09/30 | **70%** | **Phase 2** |
| 2028/10/01～2030/09/30 | 50% | Phase 2 |
| 2030/10/01～2031/09/30 | 30% | Phase 2 |

---

**End of Document**
