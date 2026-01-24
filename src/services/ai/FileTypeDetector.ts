import type { Client } from '@/types/client';

/**
 * ファイル形式検出 + 仕訳生成サービス
 *
 * Phase 1実装:
 * - Gemini Vision APIでファイル形式を自動判定
 * - 1回のAPI呼び出しで判定+仕訳生成
 *
 * 注意:
 * - このファイルはプロンプト構築のみ実施
 * - 実際のAPI呼び出しはGeminiVisionServiceで実施
 */
export class FileTypeDetector {

  /**
   * ファイル形式判定 + 仕訳生成のプロンプトを構築
   *
   * @param client 顧問先情報
   * @returns プロンプト文字列
   */
  static buildPrompt(
    client: Pick<Client, 'id' | 'clientCode' | 'fiscalMonth' | 'taxMethod' | 'calculationMethod' | 'defaultPaymentMethod' | 'isInvoiceRegistered'>
  ): string {
    // 顧問先の会計期間を計算
    const { periodStart, periodEnd } = this.calculatePeriod(client);

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
- 顧問先コード: ${client.clientCode || 'XXX'}
- 決算月: ${client.fiscalMonth || 3}月
- 会計方式: ${client.taxMethod === 'inclusive' ? '税込' : '税抜'}
- 計上基準: ${client.calculationMethod || '期中現金'}
- デフォルト決済手段: ${client.defaultPaymentMethod || '現金'}
- インボイス登録: ${client.isInvoiceRegistered ? 'あり' : 'なし'}
- 当期会計期間: ${periodStart} 〜 ${periodEnd}

仕訳データを生成してください。

【重要な指示】
1. 取引先名を抽出した場合、vendorNameRaw に設定
   例: "カ)ABC シヤ" → vendorNameRaw = "カ)ABC シヤ"

2. 税区分は以下の中間コードを使用:
   - TAXABLE_PURCHASE_10: 課税仕入10%
   - TAXABLE_PURCHASE_REDUCED_8: 課税仕入8%(軽)
   - TAXABLE_SALES_10: 課税売上10%
   - NON_TAXABLE_SALES: 非課税売上
   - OUT_OF_SCOPE_PURCHASE: 対象外

3. インボイス控除区分:
   - QUALIFIED: 適格請求書（登録番号T+13桁あり）
   - DEDUCTION_80: 80%控除（登録番号なし、～2026/09/30）
   - DEDUCTION_NONE: 控除不可

4. 計算期間外チェック:
   - 仕訳日付が ${periodStart} 〜 ${periodEnd} の範囲外なら警告

5. 勘定科目のマッピング（領収書の場合）:
   - 文房具・事務用品 → 4000（消耗品費）
   - 食事・飲食 → 6000（会議費）
   - 交通費 → 5000（旅費交通費）
   - 書籍 → 4100（新聞図書費）
   - その他 → 9000（雑費）

【出力形式】
JSON形式のみ。説明文は不要。

【出力例】
{
  "fileType": "RECEIPT",
  "journalEntry": {
    "date": "2026-01-23",
    "description": "ABC ストア 事務用品",
    "totalAmount": 1100,
    "lines": [
      {
        "accountCode": "4000",
        "accountName": "消耗品費",
        "debit": 1100,
        "credit": 0,
        "vendorNameRaw": "カ)ABC シヤ",
        "taxCode": "TAXABLE_PURCHASE_10",
        "invoiceDeduction": "QUALIFIED",
        "taxAmountFromDocument": 100,
        "taxAmountCalculated": 100,
        "taxAmountFinal": 100,
        "isAIGenerated": true
      },
      {
        "accountCode": "1000",
        "accountName": "現金",
        "debit": 0,
        "credit": 1100,
        "taxCode": "OUT_OF_SCOPE_PURCHASE",
        "taxAmountCalculated": 0,
        "taxAmountFinal": 0,
        "isAIGenerated": true
      }
    ],
    "aiSourceType": "gemini",
    "aiConfidence": 0.85
  }
}
`;
  }

  /**
   * 会計期間を計算
   *
   * TD-001対応: Partial<Client>をPick<Client>に変更（ADR-011準拠）
   */
  private static calculatePeriod(client: Pick<Client, 'fiscalMonth'>): { periodStart: string; periodEnd: string } {
    const fiscalMonth = client.fiscalMonth;
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
}
