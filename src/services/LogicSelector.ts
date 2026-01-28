/**
 * Logic Selector - OCRと掃き出しフォーマットの組み合わせ管理
 *
 * OCRストラテジー（Gemini, Anthropic等）と会計ソフト形式（弥生, Freee, MF）の
 * 組み合わせを動的に切り替え、型の整合性を保証する
 *
 * Features:
 * - OCR/掃き出しの組み合わせが不正な場合はエラー
 * - マッピング関数を自動生成
 * - IDEの補完サポート
 */

import { createMapper } from '@/utils/schema-mapper';
import {
    Mappings,
    OCRStrategy,
    ExportFormat,
    StrategyToSchema,
    FormatToSchema,
    MappingName,
} from '@/mappings/ocr-to-accounting';

/**
 * ロジック・セレクター
 *
 * OCRと掃き出しフォーマットの組み合わせを管理し、
 * 対応するマッピング関数を提供する
 */
export class LogicSelector {
    private ocrStrategy: OCRStrategy | null = null;
    private exportFormat: ExportFormat | null = null;

    /**
     * OCRストラテジーを選択
     *
     * @param strategy OCRストラテジー名
     */
    selectOCR(strategy: OCRStrategy): void {
        this.ocrStrategy = strategy;
    }

    /**
     * 掃き出しフォーマットを選択
     *
     * @param format 会計ソフト形式名
     */
    selectExport(format: ExportFormat): void {
        this.exportFormat = format;
    }

    /**
     * 現在の組み合わせが有効かチェック
     *
     * @returns 有効な組み合わせならtrue
     */
    isValid(): boolean {
        if (!this.ocrStrategy || !this.exportFormat) {
            return false;
        }

        const mappingKey = this.getMappingKey();
        return mappingKey in Mappings;
    }

    /**
     * 現在の組み合わせに対応するマッピング関数を取得
     *
     * @returns マッピング関数
     * @throws 無効な組み合わせの場合
     */
    getMapper(): ((data: any) => any) | null {
        if (!this.isValid()) {
            return null;
        }

        const mappingKey = this.getMappingKey() as MappingName;
        const mapping = Mappings[mappingKey];

        const sourceSchema = StrategyToSchema[this.ocrStrategy!];
        const targetSchema = FormatToSchema[this.exportFormat!];

        return createMapper(sourceSchema, targetSchema, mapping as any);
    }

    /**
     * マッピング関数を実行（安全版）
     *
     * @param data OCR出力データ
     * @returns 会計ソフト形式データ
     * @throws 無効な組み合わせまたはデータエラー
     */
    transform(data: any): any {
        const mapper = this.getMapper();
        if (!mapper) {
            throw new Error(
                `Invalid combination: ${this.ocrStrategy} → ${this.exportFormat}`
            );
        }

        return mapper(data);
    }

    /**
     * 現在の状態を取得
     */
    getState() {
        return {
            ocrStrategy: this.ocrStrategy,
            exportFormat: this.exportFormat,
            isValid: this.isValid(),
            mappingKey: this.isValid() ? this.getMappingKey() : null,
        };
    }

    /**
     * マッピングキー名を生成
     *
     * @private
     */
    private getMappingKey(): string {
        if (!this.ocrStrategy || !this.exportFormat) {
            return '';
        }

        // GeminiToYayoi の形式
        const strategyCapitalized =
            this.ocrStrategy.charAt(0).toUpperCase() +
            this.ocrStrategy.slice(1).toLowerCase();
        const formatCapitalized =
            this.exportFormat.charAt(0).toUpperCase() +
            this.exportFormat.slice(1).toLowerCase();

        return `${strategyCapitalized}To${formatCapitalized}`;
    }

    /**
     * リセット
     */
    reset(): void {
        this.ocrStrategy = null;
        this.exportFormat = null;
    }
}

/**
 * ファクトリー関数
 *
 * 初期値を指定してインスタンスを生成
 */
export function createLogicSelector(
    ocr?: OCRStrategy,
    format?: ExportFormat
): LogicSelector {
    const selector = new LogicSelector();
    if (ocr) selector.selectOCR(ocr);
    if (format) selector.selectExport(format);
    return selector;
}
