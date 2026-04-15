/**
 * validateClassifyResult.ts — サーバー側バリデーション（データ駆動）
 *
 * 責務: ClassifyResponseを受け取り、OK / NG / 補助対象 を判定する
 * 配置: src/api/services/pipeline/ — サーバー側でのみ使用
 *       classify.service.ts → postprocess → ★validate★ の順で呼ばれる
 *
 * 設計原則:
 *   - validate = 判定のみ。計算（税検算等）はpostprocess.tsの責務
 *   - データ駆動: SOURCE_TYPE_VALIDATION_CONFIG テーブルでルール管理
 */

import type { ClassifyResponse, SourceType } from './types';
import {
  multiDocumentError,
  MSG_FALLBACK_ERROR,
  MSG_ISSUER_MISSING,
  MSG_DATE_MISSING,
  MSG_AMOUNT_MISSING,
} from '../../../shared/validationMessages';

// ============================================================
// 証票種別ごとのバリデーション設定（データ駆動テーブル）
// ============================================================

interface SourceTypeValidationConfig {
  /** 日付（date）チェックが必要か */
  requireDate: boolean;
  /** 金額（amount）チェックが必要か */
  requireAmount: boolean;
  /** 取引先（issuer_name）チェックが必要か */
  requireIssuer: boolean;
}

/**
 * SOURCE_TYPE_VALIDATION_CONFIG — 証票種別ごとのバリデーション対象
 *
 * 通帳・クレカ: 行データ（line_items）があれば十分。
 *   銀行名・カード会社名はStep 3（取引先照合）で特定する。
 * supplementary_doc / non_journal / other: excluded扱いで先にリターン。
 */
export const SOURCE_TYPE_VALIDATION_CONFIG: Record<SourceType, SourceTypeValidationConfig> = {
  receipt:          { requireDate: true,  requireAmount: true,  requireIssuer: true  },
  invoice_received: { requireDate: true,  requireAmount: true,  requireIssuer: true  },
  tax_payment:      { requireDate: true,  requireAmount: true,  requireIssuer: true  },
  journal_voucher:  { requireDate: true,  requireAmount: true,  requireIssuer: true  },
  bank_statement:   { requireDate: false, requireAmount: false, requireIssuer: false },
  credit_card:      { requireDate: false, requireAmount: false, requireIssuer: false },
  cash_ledger:      { requireDate: true,  requireAmount: true,  requireIssuer: true  },
  invoice_issued:   { requireDate: true,  requireAmount: true,  requireIssuer: true  },
  receipt_issued:   { requireDate: true,  requireAmount: true,  requireIssuer: true  },
  supplementary_doc: { requireDate: false, requireAmount: false, requireIssuer: false },
  non_journal:      { requireDate: false, requireAmount: false, requireIssuer: false },
  other:            { requireDate: false, requireAmount: false, requireIssuer: false },
};

/** バリデーションで免除される（excluded）証票種別 */
const EXCLUDED_SOURCE_TYPES: ReadonlySet<SourceType> = new Set([
  'non_journal',
  'supplementary_doc',
  'other',
]);

// ============================================================
// バリデーション結果型
// ============================================================

export interface ValidationResult {
  ok: boolean;
  errorReason: string | null;
  supplementary: boolean;
  warning: string | null;
}

// ============================================================
// メイン関数
// ============================================================

/**
 * ClassifyResponseを検証し、OK / NG / 補助対象 を判定する。
 *
 * ルール評価順序（優先度順。最初にhitしたルールで確定）:
 *   1. document_count >= 2 → OK + 警告（Gemini誤判定があるためNG強制しない）
 *   2. excluded証票種別 → OK（補助対象）
 *   3. fallback_applied → NG
 *   4. issuer_name = null or 空文字 → NG（証票種別設定で必須の場合のみ）
 *   5. date = null → NG（同上）
 *   6. amount = null or <= 0 → NG（同上）
 *   7. 全チェック通過 → OK
 */
export function validateClassifyResult(data: ClassifyResponse): ValidationResult {
  // 証票2枚以上 → NG（1枚ずつ撮り直してもらう）
  if (data.document_count >= 2) {
    return {
      ok: false,
      errorReason: multiDocumentError(data.document_count),
      supplementary: false,
      warning: null,
    };
  }

  // 除外対象 → 補助対象として通す
  if (EXCLUDED_SOURCE_TYPES.has(data.source_type)) {
    return { ok: true, errorReason: null, supplementary: true, warning: null };
  }

  // fallback適用時 → NG
  if (data.fallback_applied) {
    return { ok: false, errorReason: MSG_FALLBACK_ERROR, supplementary: false, warning: null };
  }

  // 証票種別ごとのバリデーション設定
  const config = SOURCE_TYPE_VALIDATION_CONFIG[data.source_type];

  // 取引先チェック
  if (config.requireIssuer && (!data.issuer_name || data.issuer_name.trim() === '')) {
    return { ok: false, errorReason: MSG_ISSUER_MISSING, supplementary: false, warning: null };
  }

  // 日付チェック
  if (config.requireDate && !data.date) {
    return { ok: false, errorReason: MSG_DATE_MISSING, supplementary: false, warning: null };
  }

  // 金額チェック
  if (config.requireAmount && (data.total_amount === null || data.total_amount <= 0)) {
    return { ok: false, errorReason: MSG_AMOUNT_MISSING, supplementary: false, warning: null };
  }

  // 全チェック通過 → OK
  return { ok: true, errorReason: null, supplementary: false, warning: null };
}
