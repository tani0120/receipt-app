/**
 * パイプライン postprocess（整形・fallback適用）
 *
 * レイヤー: route → service → ★postprocess★
 * 責務: AI生出力のバリデーション + fallback + ProcessingMode判定
 */

import {
  SOURCE_TYPES,
  DIRECTIONS,
  type SourceType,
  type Direction,
  type ProcessingMode,
  type ClassifyRawResponse,
  type ClassifyResponse,
  type ClassifyResponseLineItem,
} from './types';

// ============================================================
// source_type → ProcessingMode マッピング
// ============================================================

const MODE_MAP: Record<SourceType, ProcessingMode> = {
  receipt: 'auto',
  invoice_received: 'auto',
  tax_payment: 'auto',
  journal_voucher: 'auto',
  bank_statement: 'auto',
  credit_card: 'auto',
  cash_ledger: 'auto',
  supplementary_doc: 'auto',
  invoice_issued: 'manual',
  receipt_issued: 'manual',
  non_journal: 'excluded',
  other: 'excluded',
};

// ============================================================
// fallback定数
// ============================================================

const FALLBACK_CLASSIFY: ClassifyRawResponse = {
  source_type: 'other',
  source_type_confidence: 0,
  direction: 'expense',
  direction_confidence: 0,
  classify_reason: null,
  document_count: 1,
  document_count_reason: null,
  description: null,
  issuer_name: null,
  date: null,
  total_amount: null,
};

// ============================================================
// バリデーション
// ============================================================

function isValidSourceType(v: unknown): v is SourceType {
  return typeof v === 'string' && (SOURCE_TYPES as readonly string[]).includes(v);
}

function isValidDirection(v: unknown): v is Direction {
  return typeof v === 'string' && (DIRECTIONS as readonly string[]).includes(v);
}

// ============================================================
// メイン関数
// ============================================================

/**
 * AI生出力を検証し、安全なClassifyResponseに変換する。
 * AI失敗時はfallback（source_type: 'other', confidence: 0）を返す。
 * 例外を投げない。
 */
export function postprocessClassify(
  raw: ClassifyRawResponse | null,
  metadata: ClassifyResponse['metadata'],
): ClassifyResponse {
  // AI出力がnull（API呼び出し失敗等）→ 全面fallback
  if (!raw) {
    console.warn('[pipeline/postprocess] AI出力がnull → fallback適用');
    return buildResponse(FALLBACK_CLASSIFY, true, [], metadata);
  }

  let fallbackApplied = false;

  // source_typeバリデーション
  let sourceType: SourceType;
  if (isValidSourceType(raw.source_type)) {
    sourceType = raw.source_type;
  } else {
    console.warn(`[pipeline/postprocess] 不正なsource_type: "${raw.source_type}" → fallback: "other"`);
    sourceType = 'other';
    fallbackApplied = true;
  }

  // directionバリデーション
  let direction: Direction;
  if (isValidDirection(raw.direction)) {
    direction = raw.direction;
  } else {
    console.warn(`[pipeline/postprocess] 不正なdirection: "${raw.direction}" → fallback: "expense"`);
    direction = 'expense';
    fallbackApplied = true;
  }

  // confidenceバリデーション（0-1の範囲に収める）
  const stConf = clampConfidence(raw.source_type_confidence);
  const dirConf = clampConfidence(raw.direction_confidence);

  const validated: ClassifyRawResponse = {
    source_type: sourceType,
    source_type_confidence: stConf,
    direction,
    direction_confidence: dirConf,
    classify_reason: raw.classify_reason ?? null,
    document_count: typeof raw.document_count === 'number' && raw.document_count >= 1 ? Math.round(raw.document_count) : 1,
    document_count_reason: raw.document_count_reason ?? null,
    description: raw.description ?? null,
    issuer_name: raw.issuer_name ?? null,
    date: raw.date ?? null,
    total_amount: raw.total_amount ?? null,
  };

  // line_itemsバリデーション + line_index付番
  const lineItems: ClassifyResponseLineItem[] = (raw.line_items ?? []).map((item, idx) => ({
    line_index: idx + 1,
    date: item.date ?? null,
    description: item.description ?? '',
    amount: typeof item.amount === 'number' && item.amount >= 0 ? Math.round(item.amount) : 0,
    direction: item.direction === 'income' ? 'income' : 'expense',
    balance: typeof item.balance === 'number' ? Math.round(item.balance) : null,
  }));

  return buildResponse(validated, fallbackApplied, lineItems, metadata);
}

// ============================================================
// 内部ヘルパー
// ============================================================

function buildResponse(
  raw: ClassifyRawResponse,
  fallbackApplied: boolean,
  lineItems: ClassifyResponseLineItem[],
  metadata: ClassifyResponse['metadata'],
): ClassifyResponse {
  const sourceType = raw.source_type as SourceType;
  const direction = raw.direction as Direction;

  return {
    source_type: sourceType,
    source_type_confidence: raw.source_type_confidence,
    direction,
    direction_confidence: raw.direction_confidence,
    processing_mode: MODE_MAP[sourceType],
    classify_reason: raw.classify_reason ?? null,
    document_count: raw.document_count ?? 1,
    document_count_reason: raw.document_count_reason ?? null,
    description: raw.description,
    issuer_name: raw.issuer_name,
    date: raw.date,
    total_amount: raw.total_amount,
    fallback_applied: fallbackApplied,
    line_items: lineItems,
    // validation: classify.service.tsでvalidateClassifyResult()の結果で上書きされる
    validation: { ok: false, errorReason: null, warning: null, supplementary: false },
    metadata,
  };
}

function clampConfidence(v: unknown): number {
  if (typeof v !== 'number' || isNaN(v)) return 0;
  return Math.max(0, Math.min(1, v));
}
