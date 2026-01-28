/**
 * 税区分マッピングサービス
 *
 * Phase 1: MFのみ実装
 * Phase 2: Freee、弥生を追加
 *
 * 目的:
 * - 内部コード（TAXABLE_PURCHASE_10等）から会計ソフト別形式への変換
 * - CSV出力時に使用
 */
export class TaxCodeMapper {

    /**
     * MF クラウド形式に変換
     *
     * @param internalCode 内部税区分コード
     * @param invoiceDeduction インボイス控除区分
     * @returns MF形式の税区分とインボイスフラグ
     */
    static toMF(
        internalCode: string,
        invoiceDeduction?: string
    ): { taxCode: string; invoiceFlag: string } {

        // 税区分マッピング
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

            // 特殊
            'REVERSE_CHARGE': '課仕 10%',  // リバースチャージ（MFでは通常課仕として扱う）
            'IMPORT_TAX': '課仕 10%',      // 輸入消費税
        };

        // インボイスフラグマッピング（MFは別列で指定）
        const invoiceMapping: Record<string, string> = {
            'QUALIFIED': '適格',
            'DEDUCTION_80': '80%控除',
            'DEDUCTION_70': '70%控除',  // Phase 2（2026/10/01～）
            'DEDUCTION_50': '50%控除',  // Phase 2
            'DEDUCTION_30': '30%控除',  // Phase 2
            'DEDUCTION_NONE': '控除不可',
        };

        const taxCode = taxMapping[internalCode];
        if (!taxCode) {
            console.warn(`未知の税区分コード: ${internalCode}`);
            return { taxCode: '', invoiceFlag: '' };
        }

        const invoiceFlag = invoiceMapping[invoiceDeduction || 'QUALIFIED'] || '';

        return { taxCode, invoiceFlag };
    }

    /**
     * Freee 形式に変換
     *
     * Phase 2で実装
     */
    static toFreee(
        internalCode: string,
        invoiceDeduction?: string
    ): string {
        // Phase 2で実装予定

        // 参考: Freee形式
        // 'TAXABLE_SALES_10' → '課税売上10%'
        // 'TAXABLE_PURCHASE_10' + 'DEDUCTION_80' → '課対仕入(控80)10%'

        throw new Error('toFreee() はPhase 2で実装予定');
    }

    /**
     * 弥生会計形式に変換
     *
     * Phase 2で実装
     */
    static toYayoi(
        internalCode: string,
        invoiceDeduction?: string
    ): string {
        // Phase 2で実装予定

        // 参考: 弥生形式
        // 'TAXABLE_SALES_10' → '課税売上込10%'
        // 'TAXABLE_PURCHASE_10' + 'DEDUCTION_80' → '課対仕入込10%区分80%'

        throw new Error('toYayoi() はPhase 2で実装予定');
    }

    /**
     * 内部コードから税率を取得（参考値）
     */
    static getTaxRate(internalCode: string): number {
        if (internalCode.includes('_10')) return 0.10;
        if (internalCode.includes('_REDUCED_8')) return 0.08;
        return 0;
    }
}
