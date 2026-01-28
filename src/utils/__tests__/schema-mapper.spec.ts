/**
 * Schema Mapper Tests - 型安全マッピングの検証
 *
 * 「壊せなさ」を実証するテストスイート
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
    createMapper,
    createMapperWithTransform,
    validateMapping,
} from '../schema-mapper';

describe('Schema Mapper', () => {
    // テスト用スキーマ
    const SourceSchema = z.object({
        name: z.string(),
        age: z.number(),
        email: z.string().email(),
    });

    const TargetSchema = z.object({
        fullName: z.string(),
        years: z.number(),
        contact: z.string(),
    });

    describe('createMapper', () => {
        it('正常なマッピングが成功する', () => {
            const mapper = createMapper(
                SourceSchema,
                TargetSchema,
                {
                    name: 'fullName',
                    age: 'years',
                    email: 'contact',
                }
            );

            const input = {
                name: '山田太郎',
                age: 30,
                email: 'yamada@example.com',
            };

            const output = mapper(input);

            expect(output.fullName).toBe('山田太郎');
            expect(output.years).toBe(30);
            expect(output.contact).toBe('yamada@example.com');
        });

        it('入力データの型が間違っている場合はエラー', () => {
            const mapper = createMapper(
                SourceSchema,
                TargetSchema,
                {
                    name: 'fullName',
                    age: 'years',
                    email: 'contact',
                }
            );

            const invalidInput = {
                name: '山田太郎',
                age: '30', // 数値が期待されるが文字列
                email: 'yamada@example.com',
            };

            expect(() => mapper(invalidInput as any)).toThrow();
        });

        it('部分マッピングでも動作する', () => {
            const mapper = createMapper(
                SourceSchema,
                TargetSchema,
                {
                    name: 'fullName',
                    age: 'years',
                    // email は省略
                }
            );

            const input = {
                name: '山田太郎',
                age: 30,
                email: 'yamada@example.com',
            };

            // emailがマッピングされていないため、contactフィールドが欠けている
            expect(() => mapper(input)).toThrow();
        });
    });

    describe('createMapperWithTransform', () => {
        it('変換機能付きマッピングが成功する', () => {
            const SourceWithString = z.object({
                price: z.string(),
                quantity: z.string(),
            });

            const TargetWithNumber = z.object({
                amount: z.number(),
                count: z.number(),
            });

            const mapper = createMapperWithTransform(
                SourceWithString,
                TargetWithNumber,
                {
                    price: {
                        target: 'amount',
                        transform: (v) => parseInt(v as string, 10),
                    },
                    quantity: {
                        target: 'count',
                        transform: (v) => parseInt(v as string, 10),
                    },
                }
            );

            const input = {
                price: '1000',
                quantity: '5',
            };

            const output = mapper(input);

            expect(output.amount).toBe(1000);
            expect(output.count).toBe(5);
        });

        it('変換関数が失敗した場合はエラー', () => {
            const SourceWithString = z.object({
                price: z.string(),
            });

            const TargetWithNumber = z.object({
                amount: z.number(),
            });

            const mapper = createMapperWithTransform(
                SourceWithString,
                TargetWithNumber,
                {
                    price: {
                        target: 'amount',
                        transform: (v) => parseInt(v as string, 10),
                    },
                }
            );

            const invalidInput = {
                price: 'invalid_number',
            };

            // parseIntはNaNを返すが、Zodの型検証でエラーになる
            expect(() => mapper(invalidInput)).toThrow();
        });
    });

    describe('validateMapping', () => {
        it('正常なマッピングは検証を通過する', () => {
            const result = validateMapping(
                SourceSchema,
                TargetSchema,
                {
                    name: 'fullName',
                    age: 'years',
                    email: 'contact',
                }
            );

            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('存在しないソースキーはエラー', () => {
            const result = validateMapping(
                SourceSchema,
                TargetSchema,
                {
                    invalidKey: 'fullName', // 存在しないキー
                } as any
            );

            expect(result.valid).toBe(false);
            expect(result.errors).toContain(
                'Source key "invalidKey" does not exist in source schema'
            );
        });

        it('存在しないターゲットキーはエラー', () => {
            const result = validateMapping(
                SourceSchema,
                TargetSchema,
                {
                    name: 'invalidTarget', // 存在しないキー
                } as any
            );

            expect(result.valid).toBe(false);
            expect(result.errors).toContain(
                'Target key "invalidTarget" does not exist in target schema'
            );
        });
    });

    describe('実世界のユースケース', () => {
        // OCR出力（Gemini）→ 会計ソフト（弥生）のマッピング
        const GeminiOutputSchema = z.object({
            vendor: z.string(),
            totalAmount: z.number(),
            date: z.string(),
            taxRate: z.number(),
        });

        const YayoiSchema = z.object({
            vendor_name: z.string(),
            amount: z.number(),
            transaction_date: z.string(),
            tax: z.number(),
        });

        it('Gemini → 弥生のマッピングが成功する', () => {
            const mapper = createMapper(
                GeminiOutputSchema,
                YayoiSchema,
                {
                    vendor: 'vendor_name',
                    totalAmount: 'amount',
                    date: 'transaction_date',
                    taxRate: 'tax',
                }
            );

            const geminiOutput = {
                vendor: '株式会社テスト',
                totalAmount: 10000,
                date: '2026-01-14',
                taxRate: 10,
            };

            const yayoiInput = mapper(geminiOutput);

            expect(yayoiInput.vendor_name).toBe('株式会社テスト');
            expect(yayoiInput.amount).toBe(10000);
            expect(yayoiInput.transaction_date).toBe('2026-01-14');
            expect(yayoiInput.tax).toBe(10);
        });
    });
});
