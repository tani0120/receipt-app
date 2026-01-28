/**
 * Schema Mapper - 型安全なマッピング関数
 *
 * Zodスキーマ間のデータ変換を型安全に実行する
 *
 * Features:
 * - コンパイル時の型チェック
 * - 実行時のバリデーション（Zod）
 * - IDEの補完サポート
 *
 * Usage:
 * ```typescript
 * const mapper = createMapper(
 *   GeminiOutputSchema,
 *   YayoiSchema,
 *   { vendor: 'vendor_name', total: 'amount' }
 * );
 *
 * const result = mapper({ vendor: '株式会社テスト', total: 10000 });
 * // → { vendor_name: '株式会社テスト', amount: 10000 }
 * ```
 */

import { z, ZodObject, ZodRawShape } from 'zod';

/**
 * マッピング定義の型
 *
 * SourceとTargetの両方のキーが存在することを保証
 */
export type Mapping<
    S extends ZodRawShape,
    T extends ZodRawShape
> = Partial<Record<keyof S, keyof T>>;

/**
 * 型安全なマッピング関数を作成
 *
 * @param sourceSchema 入力スキーマ
 * @param targetSchema 出力スキーマ
 * @param mapping フィールドマッピング定義
 * @returns マッピング関数
 *
 * @example
 * ```typescript
 * const mapper = createMapper(
 *   z.object({ a: z.string(), b: z.number() }),
 *   z.object({ x: z.string(), y: z.number() }),
 *   { a: 'x', b: 'y' }
 * );
 *
 * mapper({ a: 'test', b: 123 }); // → { x: 'test', y: 123 }
 * ```
 */
export function createMapper<
    S extends ZodRawShape,
    T extends ZodRawShape
>(
    sourceSchema: ZodObject<S>,
    targetSchema: ZodObject<T>,
    mapping: Mapping<S, T>
): (data: z.infer<ZodObject<S>>) => z.infer<ZodObject<T>> {
    return (data: z.infer<ZodObject<S>>): z.infer<ZodObject<T>> => {
        // 1. 入力データの検証
        const validatedInput = sourceSchema.parse(data);

        // 2. マッピング実行
        const result: any = {};
        for (const [sourceKey, targetKey] of Object.entries(mapping)) {
            if (targetKey && sourceKey in validatedInput) {
                result[targetKey] = validatedInput[sourceKey as keyof typeof validatedInput];
            }
        }

        // 3. 出力データの検証
        return targetSchema.parse(result);
    };
}

/**
 * 変換機能付きマッピング関数を作成
 *
 * フィールドごとに変換関数を適用できる
 *
 * @param sourceSchema 入力スキーマ
 * @param targetSchema 出力スキーマ
 * @param mapping フィールドマッピングと変換関数
 * @returns マッピング関数
 *
 * @example
 * ```typescript
 * const mapper = createMapperWithTransform(
 *   z.object({ price: z.string() }),
 *   z.object({ amount: z.number() }),
 *   {
 *     price: { target: 'amount', transform: (v) => parseInt(v) }
 *   }
 * );
 *
 * mapper({ price: '1000' }); // → { amount: 1000 }
 * ```
 */
export type MappingWithTransform<
    S extends ZodRawShape,
    T extends ZodRawShape
> = Partial<Record<
    keyof S,
    {
        target: keyof T;
        transform?: (value: any) => any;
    }
>>;

export function createMapperWithTransform<
    S extends ZodRawShape,
    T extends ZodRawShape
>(
    sourceSchema: ZodObject<S>,
    targetSchema: ZodObject<T>,
    mapping: MappingWithTransform<S, T>
): (data: z.infer<ZodObject<S>>) => z.infer<ZodObject<T>> {
    return (data: z.infer<ZodObject<S>>): z.infer<ZodObject<T>> => {
        // 1. 入力データの検証
        const validatedInput = sourceSchema.parse(data);

        // 2. マッピングと変換を実行
        const result: any = {};
        for (const [sourceKey, config] of Object.entries(mapping)) {
            if (config && sourceKey in validatedInput) {
                const value = validatedInput[sourceKey as keyof typeof validatedInput];
                result[config.target] = config.transform ? config.transform(value) : value;
            }
        }

        // 3. 出力データの検証
        return targetSchema.parse(result);
    };
}

/**
 * マッピングの妥当性を検証
 *
 * コンパイル時に型チェックできない場合の実行時検証
 *
 * @param sourceSchema 入力スキーマ
 * @param targetSchema 出力スキーマ
 * @param mapping マッピング定義
 * @returns 検証結果
 */
export function validateMapping<
    S extends ZodRawShape,
    T extends ZodRawShape
>(
    sourceSchema: ZodObject<S>,
    targetSchema: ZodObject<T>,
    mapping: Mapping<S, T>
): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    const sourceKeys = Object.keys(sourceSchema.shape);
    const targetKeys = Object.keys(targetSchema.shape);

    for (const [sourceKey, targetKey] of Object.entries(mapping)) {
        // ソースキーの存在確認
        if (!sourceKeys.includes(sourceKey)) {
            errors.push(`Source key "${sourceKey}" does not exist in source schema`);
        }

        // ターゲットキーの存在確認
        if (targetKey && !targetKeys.includes(targetKey as string)) {
            errors.push(`Target key "${targetKey as string}" does not exist in target schema`);
        }
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}
