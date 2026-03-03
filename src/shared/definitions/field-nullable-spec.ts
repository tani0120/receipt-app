/**
 * 仕訳フィールドのnullable定義表
 *
 * 目的: 全フィールドのnull可否・警告ラベル対応・CSV出力時の扱いを一元管理
 * 準拠: journal_v2_20260214.md v2.1、tax_category_schema.md
 *
 * ルール:
 *   - null = 「存在しない」または「読み取れない」（区別しない）
 *   - 保存時バリデーションなし（止めない）
 *   - CSV出力時: nullでも出力可。ただし件数警告を表示
 *   - MFインポート: エラーは行番号付きで提示されるため、事前に候補行を警告
 *
 * 更新日: 2026-03-04
 */

// ============================================================
// null可否の定義
// ============================================================

/**
 * フィールドのnull可否と警告ラベルの対応表
 *
 * nullable:
 *   true  = null許可（読み取れない場合がある）
 *   false = null禁止（必ず値がある。なければシステムエラー）
 *
 * warningLabel:
 *   nullの場合に付与すべき警告ラベル
 *
 * csvRequired:
 *   MF CSVインポートで必須かどうか
 *   true = MF側でエラーになる可能性あり → CSV出力前に警告
 *
 * uiDisplay:
 *   UIでnullの場合の表示方法
 */
export interface FieldNullableSpec {
    /** フィールド名 */
    field: string;
    /** 日本語名（UI表示用） */
    displayName: string;
    /** null許可 */
    nullable: boolean;
    /** nullの場合に付与する警告ラベル */
    warningLabel: 'MISSING_FIELD' | 'UNREADABLE_FAILED' | null;
    /** MF CSV必須項目か */
    csvRequired: boolean;
    /** UIでのnull表示 */
    uiNullDisplay: string;
    /** 備考 */
    note: string;
}

// ============================================================
// 仕訳ヘッダのnullable定義
// ============================================================

export const JOURNAL_HEADER_NULLABLE: FieldNullableSpec[] = [
    {
        field: 'id',
        displayName: 'ID',
        nullable: false,
        warningLabel: null,
        csvRequired: false,
        uiNullDisplay: '-',
        note: 'システム生成UUID。必ず存在する',
    },
    {
        field: 'transaction_date',
        displayName: '取引日',
        nullable: true,
        warningLabel: 'MISSING_FIELD',
        csvRequired: true,
        uiNullDisplay: '-',
        note: '証憑から読み取れない場合null。MF CSVでは必須のためnullならCSV出力前警告',
    },
    {
        field: 'description',
        displayName: '摘要',
        nullable: true,
        warningLabel: 'UNREADABLE_FAILED',
        csvRequired: true,
        uiNullDisplay: '-',
        note: 'AIが摘要を生成できない場合null。MF CSVでは空欄で通る可能性あり',
    },
    {
        field: 'receipt_id',
        displayName: '証票',
        nullable: true,
        warningLabel: null,
        csvRequired: false,
        uiNullDisplay: '-',
        note: '証票なし仕訳は正常（手入力仕訳等）',
    },
    {
        field: 'memo',
        displayName: 'メモ',
        nullable: true,
        warningLabel: null,
        csvRequired: false,
        uiNullDisplay: '-',
        note: 'メモなしは正常',
    },
];

// ============================================================
// 仕訳明細行（JournalEntryLine）のnullable定義
// ============================================================

export const JOURNAL_ENTRY_NULLABLE: FieldNullableSpec[] = [
    {
        field: 'account',
        displayName: '勘定科目',
        nullable: true,
        warningLabel: 'MISSING_FIELD',
        csvRequired: true,
        uiNullDisplay: '-',
        note: 'AIが勘定科目を判定できない場合null。MF CSVでは必須',
    },
    {
        field: 'sub_account',
        displayName: '補助科目',
        nullable: true,
        warningLabel: null,
        csvRequired: false,
        uiNullDisplay: '-',
        note: '補助科目なしは正常',
    },
    {
        field: 'amount',
        displayName: '金額',
        nullable: true,
        warningLabel: 'UNREADABLE_FAILED',
        csvRequired: true,
        uiNullDisplay: '-',
        note: '金額が読み取れない場合null。MF CSVでは必須のため警告',
    },
    {
        field: 'tax_category_id',
        displayName: '税区分',
        nullable: true,
        warningLabel: null,
        csvRequired: true,
        uiNullDisplay: '-',
        note: 'AIが税区分を判定できない場合null。既にnullable。MF CSVでは空欄で通る場合あり',
    },
];

// ============================================================
// CSV出力前チェック: MF必須フィールドのnullチェック
// ============================================================

/** CSV出力前にnullチェックすべきフィールド一覧 */
export const CSV_REQUIRED_FIELDS = [
    ...JOURNAL_HEADER_NULLABLE.filter(f => f.csvRequired),
    ...JOURNAL_ENTRY_NULLABLE.filter(f => f.csvRequired),
];

// ============================================================
// UI表示: null時の統一表示
// ============================================================

/**
 * nullフィールドのUI表示
 * 全項目共通で「-」を表示する
 *
 * ソート時のnull扱い:
 *   昇順: nullは末尾
 *   降順: nullは先頭
 */
export const NULL_DISPLAY = '-';

/**
 * ソート時のnull比較関数
 * nullを昇順=末尾、降順=先頭に配置する
 */
export function compareWithNull<T>(
    a: T | null | undefined,
    b: T | null | undefined,
    direction: 'asc' | 'desc',
    compareFn: (a: T, b: T) => number
): number {
    const aIsNull = a === null || a === undefined;
    const bIsNull = b === null || b === undefined;

    if (aIsNull && bIsNull) return 0;
    if (aIsNull) return direction === 'asc' ? 1 : -1; // null末尾(asc) or 先頭(desc)
    if (bIsNull) return direction === 'asc' ? -1 : 1;

    return compareFn(a, b);
}
