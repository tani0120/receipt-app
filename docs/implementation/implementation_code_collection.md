# 実装コード全文集（検索専用）

> [!WARNING]
> ## ⚠️ このファイルの位置づけ
> - **検索用アーカイブ**です（実装コード全文のみ）
> - **最新の意思決定・項目リストは [UI_MASTER_v2.md](../../docs/UI_MASTER_v2.md) を必ず参照**
> - このファイルは2026-01-25時点のスナップショットです
> - 意思決定情報、Phase/Step管理、項目リストは **UI_MASTER_v2.md** が唯一の正解

---

**最終更新**: 2026-01-25  
**用途**: 実装コード検索専用  
**優先度**: P3（意思決定情報はP0のUI_MASTER_v2.mdを参照）

---

## 目次

- [JournalEntrySchema（完全版）](#journalentryschema)
- [JournalLineSchema（完全版）](#journallineschema)
- [NormalizationService（完全版）](#normalizationservice)
- [TaxCodeMapper（完全版）](#taxcodemapper)
- [CsvExportService（完全版）](#csvexportservice)
- [CsvValidator（完全版）](#csvvalidator)
- [GeminiVisionService（完全版）](#geminivisionservice)
- [FileTypeDetector（完全版）](#filetypedetector)
- [ClientSchema（完全版）](#clientschema)

---

## JournalEntrySchema（完全版） {#journalentryschema}

### JournalEntryDraftSchema（OCR直後）

```typescript
import { z } from 'zod';
import { JournalLineDraftSchema, JournalLineSchema } from './JournalLineSchema';

/**
 * JournalEntry Draft（OCR直後）
 * 
 * Phase: 1
 * ステータス: Draft
 * 用途: AI OCR直後、ユーザー確認前
 */
export const JournalEntryDraftSchema = z.object({
  // ========== 基本情報 ==========
  id: z.string().uuid().describe('仕訳エントリのUUID'),
  status: z.literal("Draft").describe('Draft固定'),
  
  // ========== optional許可（AIが抽出できない場合がある） ==========
  date: z.string().optional().describe('取引日付（YYYY-MM-DD）'),
  description: z.string().optional().describe('摘要'),
  totalAmount: z.number().optional().describe('合計金額（税込）'),
  
  // ========== 明細行（最小1行、Draft時） ==========
  lines: z.array(JournalLineDraftSchema).min(1).describe('仕訳明細行'),
  
  // ========== AI情報（必須） ==========
  aiSourceType: z.enum(['gemini', 'manual', 'hybrid']).describe('AI情報源'),
  aiConfidence: z.number().min(0).max(1).describe('AI信頼度（0.0-1.0）'),
  
  // ========== 顧問先情報（必須） ==========
  clientId: z.string().describe('顧問先ID'),
  clientCode: z.string().length(3).describe('顧問先の3コード'),
  
  // ========== その他はoptional ==========
  duplicateCheckHash: z.string().optional().describe('重複検知用ハッシュ'),
  isDuplicateSuspected: z.boolean().optional().describe('重複の疑いあり'),
  similarEntries: z.array(z.string()).optional().describe('類似仕訳のIDリスト'),
  
  sourceFiles: z.array(z.object({
    fileId: z.string(),
    fileName: z.string(),
    fileType: z.string(),
  })).optional().describe('証憑ファイル情報'),
  
  // ========== メタデータ ==========
  createdAt: z.string().describe('作成日時（ISO 8601）'),
  createdBy: z.string().describe('作成者ID'),
  updatedAt: z.string().describe('更新日時（ISO 8601）'),
  updatedBy: z.string().optional().describe('更新者ID'),
}).strict();

export type JournalEntryDraft = z.infer<typeof JournalEntryDraftSchema>;
```

### JournalEntrySchema（確認後）

```typescript
/**
 * JournalEntry（確認後）
 * 
 * Phase: 1
 * ステータス: Submitted, Approved
 * 用途: ユーザー確認後、CSV出力可能
 */
export const JournalEntrySchema = z.object({
  // ========== 基本情報 ==========
  id: z.string().uuid().describe('仕訳エントリのUUID'),
  status: z.enum(["Submitted", "Approved"]).describe('確定ステータス'),
  
  // ========== optional禁止（すべて必須） ==========
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe('取引日付（YYYY-MM-DD）'),
  description: z.string().min(1).describe('摘要'),
  totalAmount: z.number().min(0).describe('合計金額（税込）'),
  
  // ========== 明細行（最小2行、確定時） ==========
  lines: z.array(JournalLineSchema).min(2).describe('仕訳明細行'),
  
  // ========== AI情報 ==========
  aiSourceType: z.enum(['gemini', 'manual', 'hybrid']).describe('AI情報源'),
  aiConfidence: z.number().min(0).max(1).describe('AI信頼度'),
  
  // ========== 顧問先情報 ==========
  clientId: z.string().describe('顧問先ID'),
  clientCode: z.string().length(3).describe('顧問先の3コード'),
  
  // ========== 重複検知（必須） ==========
  duplicateCheckHash: z.string().describe('重複検知用ハッシュ'),
  isDuplicateSuspected: z.boolean().optional().describe('重複の疑いあり'),
  similarEntries: z.array(z.string()).optional().describe('類似仕訳のIDリスト'),
  
  // ========== 証憑情報 ==========
  sourceFiles: z.array(z.object({
    fileId: z.string(),
    fileName: z.string(),
    fileType: z.string(),
  })).describe('証憑ファイル情報'),
  
  // ========== 確認情報 ==========
  isConfirmed: z.boolean().describe('ユーザー確認済みか'),
  hasQualifiedInvoice: z.boolean().optional().describe('適格請求書か'),
  
  // ========== メタデータ ==========
  createdAt: z.string().describe('作成日時（ISO 8601）'),
  createdBy: z.string().describe('作成者ID'),
  updatedAt: z.string().describe('更新日時（ISO 8601）'),
  updatedBy: z.string().optional().describe('更新者ID'),
  
  // ========== Phase 2（将来） ==========
  aiConfidenceBreakdown: z.object({}).optional().describe('項目別AI信頼度'),
  exportHistory: z.array(z.object({})).optional().describe('出力履歴'),
  approvalWorkflow: z.object({}).optional().describe('承認ワークフロー'),
}).strict();

export type JournalEntry = z.infer<typeof JournalEntrySchema>;
```

---

## JournalLineSchema（完全版） {#journallineschema}

```typescript
import { z } from 'zod';

/**
 * JournalLine（仕訳明細行）
 * 
 * Phase: 1
 * プロパティ数: 16
 */
export const JournalLineSchema = z.object({
  // ========== 既存フィールド ==========
  lineId: z.string().uuid().describe('行のUUID'),
  accountCode: z.string().describe('勘定科目コード'),
  accountName: z.string().describe('勘定科目名'),
  debit: z.number().min(0).describe('借方金額'),
  credit: z.number().min(0).describe('貸方金額'),
  
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
  ]).describe('税区分の内部コード'),
  
  // ========== 追加3: インボイス区分（Phase 1: 80%固定） ==========
  invoiceDeduction: z.enum([
    'QUALIFIED',        // 適格請求書（100%控除）
    'DEDUCTION_80',     // 80%控除（～2026/09/30）
    'DEDUCTION_70',     // 70%控除（2026/10/01～2028/09/30）Phase 2
    'DEDUCTION_50',     // 50%控除（2028/10/01～2030/09/30）Phase 2
    'DEDUCTION_30',     // 30%控除（2030/10/01～2031/09/30）Phase 2
    'DEDUCTION_NONE',   // 控除不可
  ]).optional().default('QUALIFIED').describe('インボイス控除区分'),
  
  // ========== 税額情報（既存） ==========
  taxAmountFromDocument: z.number().min(0).optional().describe('証憑記載の税額'),
  taxAmountCalculated: z.number().min(0).describe('システム計算の税額'),
  taxAmountFinal: z.number().min(0).describe('最終確定税額（CSV出力用）'),
  
  // ========== その他 ==========
  description: z.string().optional().describe('行の摘要'),
  isAIGenerated: z.boolean().describe('AI生成か'),
  isOutOfPeriod: z.boolean().optional().describe('会計期間外か（警告）'),
  outOfPeriodReason: z.string().optional().describe('期間外の理由（例: "次期の日付"）'),
}).strict();

export type JournalLine = z.infer<typeof JournalLineSchema>;

/**
 * JournalLine Draft（OCR直後）
 */
export const JournalLineDraftSchema = JournalLineSchema.partial({
  taxAmountCalculated: true,
  taxAmountFinal: true,
}).strict();

export type JournalLineDraft = z.infer<typeof JournalLineDraftSchema>;
```

---

## NormalizationService（完全版） {#normalizationservice}

```typescript
/**
 * NFKC正規化 + 法人格除去
 * 
 * 目的: MF取引先マスタとの連動（重複登録防止）
 * Phase: 1（必須）
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

## TaxCodeMapper（完全版） {#taxcodemapper}

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
  static toFreee(internalCode: string): any {
    // Phase 2で実装
    throw new Error('Phase 2で実装予定');
  }
  
  /**
   * Phase 2: 弥生形式に変換
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
  static toYayoi(internalCode: string): any {
    // Phase 2で実装
    throw new Error('Phase 2で実装予定');
  }
}
```

---

## CsvExportService（完全版） {#csvexportservice}

```typescript
import * as iconv from 'iconv-lite';
import type { Client } from '@/features/client-management';
import type { JournalEntry } from '@/features/journal';
import { TaxCodeMapper } from './TaxCodeMapper';
import { CsvValidator } from './CsvValidator';

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
    const csvContent = this.convertToCSV(rows);
    
    // Shift-JIS変換（MF必須）
    const csvBuffer = iconv.encode(csvContent, 'Shift_JIS');
    
    return new Blob([csvBuffer], { type: 'text/csv; charset=Shift-JIS' });
  }
  
  /**
   * オブジェクト配列をCSV文字列に変換
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static convertToCSV(rows: Record<string, any>[]): string {
    if (rows.length === 0) return '';
    
    const headers = Object.keys(rows[0]);
    const headerRow = headers.join(',');
    
    const dataRows = rows.map(row => {
      return headers.map(header => {
        const value = row[header];
        // カンマやダブルクォートを含む場合はエスケープ
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',');
    });
    
    return [headerRow, ...dataRows].join('\r\n');
  }
}
```

---

## CsvValidator（完全版） {#csvvalidator}

```typescript
import type { JournalEntry } from '@/features/journal';

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
   * Phase 2: Freee の制約チェック
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
  static validateFreee(entry: any): void {
    // Phase 2で実装
    throw new Error('Phase 2で実装予定');
  }
  
  /**
   * Phase 2: 弥生 の制約チェック
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
  static validateYayoi(entry: any): void {
    // Phase 2で実装
    throw new Error('Phase 2で実装予定');
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

## GeminiVisionService（完全版） {#geminivisionservice}

```typescript
import type { Client } from '@/features/client-management';
import type { JournalEntryDraft } from '@/features/journal';
import { JournalEntryDraftSchema } from '@/features/journal/JournalEntrySchema';
import { NormalizationService } from './NormalizationService';
import { JournalSemanticGuard } from '@/features/journal';
import { FileTypeDetector } from './FileTypeDetector';

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
    fileType: string;
    journalEntry: JournalEntryDraft | null;
  }> {
    
    // 1. ファイル形式判定 + 仕訳生成のプロンプト
    const prompt = FileTypeDetector.buildPrompt(client);
    
    // 2. Gemini Vision API呼び出し
    // @type-audit: response.json()の暗黙的any型（ADR-011準拠、優先度4でunknown型に変更予定）
    const response = await fetch(process.env.GEMINI_API_ENDPOINT || '', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GEMINI_API_KEY || ''}`
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
    // @type-audit: JSON.parse()の暗黙的any型（ADR-011準拠、優先度4でunknown型に変更予定）
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
      parsed.journalEntry.lines.forEach((line: { vendorNameRaw?: string; vendorName?: string }) => {
        if (line.vendorNameRaw) {
          line.vendorName = NormalizationService.normalizeVendorName(line.vendorNameRaw);
        }
      });
      
      // 重複検知ハッシュ生成
      parsed.journalEntry.duplicateCheckHash = 
        JournalSemanticGuard.generateDuplicateHash(parsed.journalEntry);
    }
    
    // 5. スキーマ検証（Zodで厳密にチェック）
    const validated = JournalEntryDraftSchema.parse(parsed.journalEntry);
    
    return {
      fileType: parsed.fileType,
      journalEntry: validated
    };
  }
}
```

---

## FileTypeDetector（完全版） {#filetypedetector}

```typescript
import type { Client } from '@/features/client-management';

/**
 * ファイル形式判定用プロンプト
 */
export class FileTypeDetector {
  
  static buildPrompt(client: Partial<Client>): string {
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
- 決算月: ${client?.fiscalMonth || '不明'}月
- 会計方式: ${client?.taxMethod || '不明'}
- インボイス登録: ${client?.isInvoiceRegistered ? 'あり' : 'なし'}

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

## ClientSchema（完全版） {#clientschema}

```typescript
import { z } from 'zod';

/**
 * Client（顧問先）スキーマ
 * 
 * Phase: 1
 * プロパティ数: 10（基本5+消費税5）
 */
export const ClientSchema = z.object({
  // ========== 基本情報（5項目） ==========
  clientCode: z.string().length(3).describe('顧問先コード（必須、例: "CLI"）'),
  clientName: z.string().min(1).describe('顧問先名（必須、例: "株式会社ABC"）'),
  fiscalMonth: z.number().min(1).max(12).describe('決算月（必須、1-12、例: 3）'),
  taxMethod: z.enum(['inclusive', 'exclusive']).describe('税込/税抜（必須）'),
  accountingBasis: z.enum(['cash', 'accrual']).describe('現金/発生（必須）'),
  
  // ========== 消費税設定（5項目） ==========
  isInvoiceRegistered: z.boolean().describe('インボイス登録（必須、例: true）'),
  consumptionTaxException: z.enum(['2割', '3割']).nullable().optional().describe('消費税特例（任意）'),
  roundingSettings: z.enum(['truncate', 'round', 'ceiling']).describe('端数処理（必須）'),
  purchaseTaxDeduction: z.enum(['individual', 'batch']).describe('仕入税額控除（必須）'),
  transitionalMeasure: z.enum(['80%', '70%', '50%', '30%']).optional().describe('経過措置（Phase 2）'),
  
  // ========== メタデータ ==========
  id: z.string().uuid().describe('UUID'),
  createdAt: z.string().describe('作成日時（ISO 8601）'),
  updatedAt: z.string().describe('更新日時（ISO 8601）'),
}).strict();

export type Client = z.infer<typeof ClientSchema>;
```

---

## 更新履歴

| 日付 | 内容 |
|------|------|
| 2026-01-25 | 初版作成（実装コード全文集） |
