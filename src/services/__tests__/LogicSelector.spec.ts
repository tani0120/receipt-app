/**
 * Logic Selector Tests - 「壊せなさ」の実証
 *
 * ロジック・セレクターが不正な組み合わせを防ぐことを検証
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { LogicSelector, createLogicSelector } from '../LogicSelector';

describe('LogicSelector', () => {
    let selector: LogicSelector;

    beforeEach(() => {
        selector = new LogicSelector();
    });

    describe('基本動作', () => {
        it('初期状態は無効', () => {
            expect(selector.isValid()).toBe(false);
        });

        it('OCRのみ選択では無効', () => {
            selector.selectOCR('gemini');
            expect(selector.isValid()).toBe(false);
        });

        it('掃き出しのみ選択では無効', () => {
            selector.selectExport('yayoi');
            expect(selector.isValid()).toBe(false);
        });

        it('両方選択すると有効', () => {
            selector.selectOCR('gemini');
            selector.selectExport('yayoi');
            expect(selector.isValid()).toBe(true);
        });
    });

    describe('有効な組み合わせ', () => {
        const validCombinations: Array<{ ocr: string, format: string }> = [
            { ocr: 'gemini', format: 'yayoi' },
            { ocr: 'gemini', format: 'freee' },
            { ocr: 'gemini', format: 'mf' },
            { ocr: 'anthropic', format: 'yayoi' },
            { ocr: 'anthropic', format: 'freee' },
            { ocr: 'anthropic', format: 'mf' },
        ];

        validCombinations.forEach(({ ocr, format }) => {
            it(`${ocr} → ${format} は有効`, () => {
                selector.selectOCR(ocr as any);
                selector.selectExport(format as any);
                expect(selector.isValid()).toBe(true);
            });
        });
    });

    describe('マッピング実行', () => {
        it('Gemini → 弥生 のマッピングが成功', () => {
            selector.selectOCR('gemini');
            selector.selectExport('yayoi');

            const input = {
                vendor: '株式会社テスト',
                totalAmount: 10000,
                date: '2026-01-14',
            };

            const output = selector.transform(input);

            expect(output.vendor_name).toBe('株式会社テスト');
            expect(output.amount).toBe(10000);
            expect(output.transaction_date).toBe('2026-01-14');
        });

        it('Anthropic → Freee のマッピングが成功', () => {
            selector.selectOCR('anthropic');
            selector.selectExport('freee');

            const input = {
                supplier: '株式会社サンプル',
                sum: 20000,
                issueDate: '2026-01-15',
            };

            const output = selector.transform(input);

            expect(output.partner_name).toBe('株式会社サンプル');
            expect(output.total_amount).toBe(20000);
            expect(output.issue_date).toBe('2026-01-15');
        });
    });

    describe('エラーハンドリング', () => {
        it('無効な組み合わせではgetMapperがnullを返す', () => {
            expect(selector.getMapper()).toBeNull();
        });

        it('無効な組み合わせでtransformはエラー', () => {
            const input = { test: 'data' };
            expect(() => selector.transform(input)).toThrow(/Invalid combination/);
        });

        it('型が合わないデータはエラー', () => {
            selector.selectOCR('gemini');
            selector.selectExport('yayoi');

            const invalidInput = {
                vendor: '株式会社テスト',
                totalAmount: 'invalid', // 数値が期待されるが文字列
                date: '2026-01-14',
            };

            expect(() => selector.transform(invalidInput)).toThrow();
        });
    });

    describe('状態管理', () => {
        it('getStateで現在の状態を取得', () => {
            selector.selectOCR('gemini');
            selector.selectExport('yayoi');

            const state = selector.getState();

            expect(state.ocrStrategy).toBe('gemini');
            expect(state.exportFormat).toBe('yayoi');
            expect(state.isValid).toBe(true);
            expect(state.mappingKey).toBe('GeminiToYayoi');
        });

        it('resetで状態をクリア', () => {
            selector.selectOCR('gemini');
            selector.selectExport('yayoi');
            selector.reset();

            expect(selector.isValid()).toBe(false);
            const state = selector.getState();
            expect(state.ocrStrategy).toBeNull();
            expect(state.exportFormat).toBeNull();
        });
    });

    describe('ファクトリー関数', () => {
        it('初期値を指定してインスタンス生成', () => {
            const selector = createLogicSelector('gemini', 'freee');

            expect(selector.isValid()).toBe(true);
            const state = selector.getState();
            expect(state.ocrStrategy).toBe('gemini');
            expect(state.exportFormat).toBe('freee');
        });

        it('初期値なしでインスタンス生成', () => {
            const selector = createLogicSelector();

            expect(selector.isValid()).toBe(false);
        });
    });
});
