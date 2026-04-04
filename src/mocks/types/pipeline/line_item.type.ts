/**
 * line_item.type.ts — T-LI1: LineItem v1型定義
 *
 * 目的: Gemini line_items[] 出力の受け皿型（全source_type共通・N:N統一）
 *
 * 根拠: T-P4実測（2026-04-03）
 *   - 通帳23行: date/description/amount/direction/balance を100%正確に抽出
 *   - クレカ6行: date/description/amount/direction を100%正確に抽出（balance=null）
 *
 * N:N統一設計:
 *   - レシート:     line_items.length === 1（通常）
 *   - 通帳:         line_items.length === N（複数行）
 *   - クレカ明細:   line_items.length === N（複数行）
 *   全source_typeで同一型。プロンプト分岐なし。
 *
 * 含めないフィールド（設計根拠付き）:
 *   - vendor_vector  : Step 3の出力。LineItemは入力側（T-P3後にPhase 2 Group 3でテスト）
 *   - vendor_name    : 第2段階（T-P3実施後にv2で追加予定）
 *   - tax_rate       : ReceiptItem側の責務。通帳/クレカ行に税率情報はない
 *   - date_on_document / amount_on_document: date === null でコード側導出可能
 *   - debit_account / credit_account: classify_schema.ts旧世代の残骸（@deprecated）
 *
 * ReceiptItem との関係:
 *   ReceiptItem（レシート商品明細）は別型のまま維持。
 *   quantity / unit_price / tax_rate を持つため LineItem に統合しない。
 *
 * 変更履歴:
 *   2026-04-04: v1 初版（T-P4実測根拠。6フィールド確定）
 *   — v2予定: T-P3完了後に vendor_name フィールドを追加
 */

// ============================================================
// § LineItemDirection — 行レベルの入出金方向（2種）
// ============================================================

/**
 * 行レベルの入出金方向（2種）
 *
 * source_type.type.ts の Direction（4種: expense/income/transfer/mixed）とは別物。
 * 通帳・クレカ・レシートの1行は必ず expense か income のどちらか。
 * - transfer（振替）: 書類レベルの方向。個別の行には適用しない
 * - mixed（混在）:    書類レベルの方向。個別の行は必ずどちらかに確定する
 */
export type LineItemDirection = 'expense' | 'income';

// ============================================================
// § LineItem — 証票明細行（v1）
// ============================================================

/**
 * 証票明細行（v1）
 *
 * Geminiが line_items[] として返す1行分のデータ。
 * 全source_typeで共通。N:N統一設計（1行 = 1取引）。
 *
 * フィールド詳細:
 *   date        — YYYY-MM-DD形式。日付欄がない行は null。
 *                 MF出力時は toMfCsvDate() で yyyy/MM/dd に変換（実装済み）。
 *   description — 摘要。印字テキストそのまま。正規化前の生テキスト。
 *   amount      — 金額（円・整数）。負数は使用しない。direction で入出金を表現。
 *   direction   — 入出金方向（'expense' | 'income'）。
 *   balance     — 残高（円・整数）。通帳のみ有効。クレカ・レシートは null。
 *   line_index  — 行番号（1始まり）。Geminiには出させない。assignLineIndex() で自動付番。
 *
 * v2予定追加フィールド（T-P3完了後）:
 *   vendor_name?: string | null — 行別取引先名（N:N時。摘要から抽出）
 */
export interface LineItem {
  /** 日付（YYYY-MM-DD）。日付欄なしの行は null */
  date: string | null;
  /** 摘要（印字テキストそのまま。正規化前） */
  description: string;
  /** 金額（円・整数。負数なし。入出金は direction で区別） */
  amount: number;
  /** 入出金方向（行レベル） */
  direction: LineItemDirection;
  /** 残高（円・整数）。通帳のみ有効。クレカ・レシートは null */
  balance: number | null;
  /** 行番号（1始まり）。コード側で自動付番。Geminiには返させない */
  line_index: number;

  /**
   * 確定した勘定科目（ACCOUNT_MASTER ID）
   *
   * Step 4（科目確定）完了後に設定される。
   * - 確定: 'TRAVEL' 等の ACCOUNT_MASTER ID
   * - 未確定（人間判断待ち）: null
   * - パイプライン未実行: undefined（フィールドなし）
   */
  determined_account?: string | null;

  /**
   * 税区分（ACCOUNT_MASTER の default_tax_category から自動設定）
   *
   * determined_account 確定後に設定される。
   * - 確定: 'TAXABLE_PURCHASE_10' 等
   * - 未確定: null
   * - パイプライン未実行: undefined（フィールドなし）
   */
  tax_category?: string | null;

  // ── v2予定（T-P3完了後に追加）──────────────────────────────
  // /** 行別取引先名（N:N時。摘要から抽出。特定できない場合は null） */
  // vendor_name?: string | null;
}

// ============================================================
// § 型ガード関数
// ============================================================

/**
 * LineItem 型ガード
 *
 * Geminiからのレスポンスを受け取った直後に使用。
 * unknown を LineItem として安全に扱えるか検証する。
 */
export function isLineItem(v: unknown): v is LineItem {
  if (typeof v !== 'object' || v === null) return false;
  const obj = v as Record<string, unknown>;
  const dateOk =
    obj['date'] === null ||
    (typeof obj['date'] === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(obj['date']));
  return (
    dateOk &&
    typeof obj['description'] === 'string' &&
    typeof obj['amount'] === 'number' &&
    (obj['direction'] === 'expense' || obj['direction'] === 'income') &&
    (typeof obj['balance'] === 'number' || obj['balance'] === null) &&
    typeof obj['line_index'] === 'number'
  );
}

/**
 * LineItem 配列の型ガード
 *
 * Geminiが返す line_items[] 全体を一括検証する。
 */
export function isLineItemArray(v: unknown): v is LineItem[] {
  return Array.isArray(v) && v.every(isLineItem);
}

// ============================================================
// § ユーティリティ
// ============================================================

/**
 * line_index を自動付番して LineItem[] を生成する
 *
 * Geminiのレスポンスから line_index を除いた配列を受け取り、
 * 1始まりで line_index を付与して返す。
 * 空配列を渡した場合は空配列を返す（正常動作）。
 *
 * 使用例:
 *   const rawItems = geminiResponse.line_items; // line_index未付与
 *   const items = assignLineIndex(rawItems);     // 1始まりで付番
 *
 * @param rawItems - Geminiが返した line_items[]（line_index未付与）。空配列可。
 * @returns line_index 付きの LineItem[]
 */
export function assignLineIndex(
  rawItems: Omit<LineItem, 'line_index'>[]
): LineItem[] {
  return rawItems.map((item, i) => ({
    ...item,
    line_index: i + 1,
  }));
}
