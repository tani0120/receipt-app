/**
 * Gemini OCR スキーマバリデーション（改善反映版）
 *
 * Pydantic相当の型バリデーション機能
 * Phase 6.2-A: 基本的な型チェック
 * Phase 6.2-B: 厳格なバリデーション追加予定
 *
 * 改善ポイント:
 * ② OCRErrorCode を使用（型安全性向上）
 */

import type { AIIntermediateOutput, TaxItem, AuditResults, OCRErrorCode } from '@/types/GeminiOCR.types';

/**
 * バリデーションエラー
 */
export class ValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ValidationError';
    }
}

/**
 * AIIntermediateOutput のバリデーション
 *
 * Phase 6.2-A: 基本的な型チェックのみ
 * Phase 6.2-B: 厳格なバリデーションを追加
 *
 * @param data - Geminiから返されたJSON
 * @returns バリデーション済みのAIIntermediateOutput
 * @throws ValidationError - バリデーション失敗時
 */
export function validateAIIntermediateOutput(data: any): AIIntermediateOutput {
    // 必須項目チェック
    if (!data.category) {
        throw new ValidationError('category is required');
    }

    if (!data.vendor) {
        throw new ValidationError('vendor is required');
    }

    if (!data.date) {
        throw new ValidationError('date is required');
    }

    if (typeof data.total_amount !== 'number') {
        throw new ValidationError('total_amount must be a number');
    }

    if (!Array.isArray(data.tax_items)) {
        throw new ValidationError('tax_items must be an array');
    }

    if (!data.explanation) {
        throw new ValidationError('explanation is required');
    }

    // カテゴリチェック
    const validCategories = ['RECEIPT', 'PASSBOOK', 'CARD', 'EXCLUDED'];
    if (!validCategories.includes(data.category)) {
        throw new ValidationError(`Invalid category: ${data.category}`);
    }

    // Phase 6.2対象チェック
    if (data.category === 'PASSBOOK') {
        throw new ValidationError('PASSBOOK_NOT_SUPPORTED_YET');
    }

    if (data.category === 'CARD') {
        throw new ValidationError('CARD_NOT_SUPPORTED_YET');
    }

    // audit_results構造チェック
    if (!data.audit_results) {
        throw new ValidationError('audit_results is required');
    }

    if (typeof data.audit_results.duplicate !== 'boolean') {
        throw new ValidationError('audit_results.duplicate must be boolean');
    }

    if (typeof data.audit_results.out_of_period !== 'boolean') {
        throw new ValidationError('audit_results.out_of_period must be boolean');
    }

    if (!['OK', 'NG'].includes(data.audit_results.balance_check)) {
        throw new ValidationError('audit_results.balance_check must be "OK" or "NG"');
    }

    // errors配列チェック（改善②：型安全性向上）
    if (!Array.isArray(data.errors)) {
        throw new ValidationError('errors must be an array');
    }

    const validErrorCodes: OCRErrorCode[] = [
        'PASSBOOK_NOT_SUPPORTED_YET',
        'CARD_NOT_SUPPORTED_YET',
        'DATE_OUT_OF_PERIOD',
        'DUPLICATE_DETECTED',
        'BALANCE_MISMATCH',
        'T_NUMBER_NOT_FOUND',
        'INVALID_IMAGE_FORMAT'
    ];

    for (const error of data.errors) {
        if (!validErrorCodes.includes(error)) {
            throw new ValidationError(`Invalid error code: ${error}`);
        }
    }

    // tax_items構造チェック
    for (const item of data.tax_items) {
        if (![10, 8].includes(item.rate)) {
            throw new ValidationError(`Invalid tax rate: ${item.rate} (must be 10 or 8)`);
        }

        if (typeof item.net !== 'number') {
            throw new ValidationError('tax_item.net must be a number');
        }

        if (typeof item.tax !== 'number') {
            throw new ValidationError('tax_item.tax must be a number');
        }
    }

    // 日付フォーマット簡易チェック（YYYY-MM-DD）
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (!datePattern.test(data.date)) {
        throw new ValidationError(`Invalid date format: ${data.date} (expected YYYY-MM-DD)`);
    }

    // confidence（optional）のチェック（改善①：Phase 6.2-Bで使用）
    if (data.confidence) {
        const confidenceFields = ['total_amount', 'date', 'tax_items', 'vendor', 't_number'];
        for (const field of confidenceFields) {
            if (data.confidence[field] !== undefined && typeof data.confidence[field] !== 'number') {
                throw new ValidationError(`confidence.${field} must be a number`);
            }
        }
    }

    return data as AIIntermediateOutput;
}

/**
 * レスポンスから安全にJSONを抽出
 *
 * @param responseText - Gemini APIレスポンステキスト
 * @returns パースされたJSON
 * @throws Error - JSON抽出失敗時
 */
export function extractJSONFromResponse(responseText: string): any {
    // マークダウンコードブロック除去
    const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) ||
        responseText.match(/```\n([\s\S]*?)\n```/);

    const jsonText = jsonMatch ? jsonMatch[1] : responseText;

    try {
        return JSON.parse(jsonText);
    } catch (error) {
        throw new Error(`Failed to parse JSON: ${error}`);
    }
}
