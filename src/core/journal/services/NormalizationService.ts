/**
 * NFKC正規化 + 法人格除去サービス
 *
 * Phase 1必須: MF取引先マスタとの連動に必要
 *
 * 目的:
 * - 表記ゆれの統一（全角/半角、カナ等）
 * - 重複登録防止（"ｱﾏｿﾞﾝ" / "アマゾン" / "Amazon.co.jp" → "Amazon.co.jp"）
 */
export class NormalizationService {

    /**
     * 取引先名の正規化
     *
     * 入力: "カ)ABC シヤ"
     * 出力: "ABC"
     *
     * 手順:
     * 1. NFKC正規化（全角英数→半角、半角カナ→全角）
     * 2. 法人格除去
     */
    static normalizeVendorName(rawName: string): string {
        // 1. NFKC正規化（Unicode標準）
        const nfkc = rawName.normalize('NFKC');

        // 2. 法人格除去
        const cleaned = nfkc
            // カタカナ法人格
            .replace(/カ\)/g, '')
            .replace(/ユ\)/g, '')
            .replace(/ゴ\)/g, '')

            // 漢字法人格
            .replace(/\(株\)/g, '')
            .replace(/（株）/g, '')
            .replace(/㈱/g, '')
            .replace(/株式会社/g, '')
            .replace(/有限会社/g, '')
            .replace(/合同会社/g, '')
            .replace(/合資会社/g, '')
            .replace(/合名会社/g, '')

            // 「シヤ」→「社」の除去（末尾のみ）
            .replace(/シヤ$/g, '')
            .replace(/社$/g, '')

            // 英語法人格
            .replace(/\bCo\.,?\s*Ltd\.?/gi, '')
            .replace(/\bInc\.?/gi, '')
            .replace(/\bCorp\.?/gi, '')
            .replace(/\bLLC/gi, '')

            .trim();

        return cleaned;
    }

    /**
     * 摘要の正規化
     *
     * 法人格は残す（摘要は全文保持が望ましい）
     * NFKC正規化のみ実施
     */
    static normalizeDescription(raw: string): string {
        return raw.normalize('NFKC').trim();
    }

    /**
     * 全角数字 → 半角数字
     */
    static normalizeNumbers(raw: string): string {
        return raw.replace(/[０-９]/g, (s) =>
            String.fromCharCode(s.charCodeAt(0) - 0xFEE0)
        );
    }

    /**
     * 全角英字 → 半角英字
     */
    static normalizeAlphabet(raw: string): string {
        return raw.replace(/[Ａ-Ｚａ-ｚ]/g, (s) =>
            String.fromCharCode(s.charCodeAt(0) - 0xFEE0)
        );
    }

    /**
     * 半角カナ → 全角カナ
     */
    static normalizeKatakana(raw: string): string {
        // NFKCで自動変換されるため、明示的な処理は不要
        return raw.normalize('NFKC');
    }

    /**
     * 総合正規化（全フィールド対応）
     */
    static normalizeAll(raw: string): string {
        return raw
            .normalize('NFKC')
            .trim();
    }
}
