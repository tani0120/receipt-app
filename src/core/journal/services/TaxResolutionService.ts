/**
 * 税額判定サービス
 *
 * 【役割】
 * OCR抽出値 vs システム計算値の差分を検出し、
 * ユーザーアクション（OK / REVIEW / MUST_FIX）を判定する
 *
 * 【戦略C】
 * - デフォルト: OCR抽出値（記載値）を採用
 * - 検証: 計算値とのズレを自動検出
 * - ユーザー判定:
 *   - ズレなし / 1円以内 → ✅ OK（自動承認）
 *   - 2-5円 → ⚠️ WARNING（確認推奨）
 *   - 5円超 → ❌ ERROR（修正必須）
 */
export class TaxResolutionService {

    /**
     * OCR税額 vs 計算値から「採用する税額」を決定
     *
     * @param ocrResult OCR抽出結果（合計金額 + 税額）
     * @param taxType 税率区分（consumption: 10%, reduced: 8%）
     * @returns 税額判定結果
     */
    static resolveTaxAmount(
        ocrResult: {
            totalAmount: number;  // 合計金額（税込）
            taxAmount: number;    // OCR抽出の税額
        },
        taxType: 'consumption' | 'reduced'
    ): {
        adoptedTaxAmount: number;           // 採用する税額（デフォルトはOCR値）
        netAmount: number;                  // 税抜金額
        confidence: 'HIGH' | 'MEDIUM' | 'LOW';  // AI信頼度
        warnings: string[];                 // 警告メッセージ
        userAction: 'OK' | 'REVIEW' | 'MUST_FIX';  // ユーザーアクション
        suggestion?: {
            calculatedTaxAmount: number;      // 計算値（参考）
            reason: string;                   // 修正提案理由
        };
    } {

        // 1. 税率を決定
        const taxRate = taxType === 'consumption' ? 0.10 : 0.08;

        // 2. 税抜金額を計算
        const netAmount = ocrResult.totalAmount - ocrResult.taxAmount;

        // 3. 計算上の税額を算出
        const calculatedTaxAmount = Math.round(netAmount * taxRate);

        // 4. 差分を計算
        const discrepancy = Math.abs(ocrResult.taxAmount - calculatedTaxAmount);

        // 5. 判定ロジック
        const warnings: string[] = [];
        let userAction: 'OK' | 'REVIEW' | 'MUST_FIX' = 'OK';
        let confidence: 'HIGH' | 'MEDIUM' | 'LOW' = 'HIGH';

        if (discrepancy === 0) {
            // ケース1: 完全一致
            warnings.push('記載値と計算値が一致しています');
        } else if (discrepancy === 1) {
            // ケース2: 1円誤差（端数処理と判定）
            warnings.push('1円の誤差は端数処理と判定されます');
        } else if (discrepancy <= 5) {
            // ケース3: 2-5円誤差（確認推奨）
            warnings.push(`記載値と計算値に${discrepancy}円の誤差があります。確認をお勧めします。`);
            userAction = 'REVIEW';
            confidence = 'MEDIUM';
        } else {
            // ケース4: 5円超の誤差（修正必須）
            warnings.push(`記載値と計算値に${discrepancy}円の大きな誤差があります。修正が必要です。`);
            userAction = 'MUST_FIX';
            confidence = 'LOW';
        }

        // 6. 結果を返す
        return {
            adoptedTaxAmount: ocrResult.taxAmount,  // デフォルトはOCR値
            netAmount,
            confidence,
            warnings,
            userAction,
            suggestion: discrepancy > 0 ? {
                calculatedTaxAmount,
                reason: `計算による期待値は${calculatedTaxAmount}円です。${discrepancy}円の差分があります。`
            } : undefined
        };
    }

    /**
     * 税額ズレの重要度を判定
     *
     * @param discrepancy 差分金額
     * @returns 重要度（OK / WARNING / ERROR）
     */
    static getSeverity(discrepancy: number): 'OK' | 'WARNING' | 'ERROR' {
        if (discrepancy <= 1) return 'OK';
        if (discrepancy <= 5) return 'WARNING';
        return 'ERROR';
    }
}
