/**
 * ============================================================
 * JournalEntryUI.ts
 * ------------------------------------------------------------
 * Journal Entry専用のUI型定義
 * Step 4 Phase B: UI ↔ Domain型の隔離
 * ============================================================
 *
 * 設計原則:
 * - UI は Domain 型を直接触らない
 * - UI は Draft 型をベースとする（未入力対応）
 * - UI 専用フィールド（displayDate, displayAmountなど）を追加
 * - Domain 型の汚染を防ぐ
 */

import type { JournalEntryDraft, JournalLineDraft } from '@/features/journal';

/**
 * 仕訳エントリのUI型（表示・編集用）
 *
 * ベース: JournalEntryDraft（未入力を許容）
 * 拡張: UI表示用のフォーマット済みフィールド
 */
export type JournalEntryUI = JournalEntryDraft & {
    /** 表示用日付（YYYY-MM-DD → YYYY年MM月DD日） */
    displayDate: string;

    /** 表示用合計金額（¥1,000 形式） */
    displayAmount: string;

    /** 仕訳明細行のUI型配列 */
    linesUI: JournalLineUI[];
};

/**
 * 仕訳明細行のUI型
 *
 * ベース: JournalLineDraft
 * 拡張: UI表示用のフォーマット済みフィールド
 */
export type JournalLineUI = JournalLineDraft & {
    /** 表示用借方金額（¥1,000 形式） */
    displayDebit: string;

    /** 表示用貸方金額（¥1,000 形式） */
    displayCredit: string;

    /** 表示用税額（¥100 形式） */
    displayTaxAmount: string;

    /** 勘定科目名（日本語） */
    accountNameJa?: string;

    /** 取引先名（フォールバック済み） */
    vendorNameSafe: string;
};

/**
 * 仕訳一覧表示用のサマリー型
 *
 * 用途: ScreenB_JournalTable.vueでの一覧表示
 */
export type JournalEntrySummaryUI = {
    readonly id: string;
    readonly displayDate: string;
    readonly description: string;
    readonly displayAmount: string;
    readonly status: 'draft' | 'confirmed' | 'error';
    readonly hasWarnings: boolean;
    readonly warningCount: number;
};
