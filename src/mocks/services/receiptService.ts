/**
 * receiptService.ts
 * サービス層: 証票分析API呼び出し
 * Vue側は常に同じ ReceiptAnalysisResult 型を受け取る
 *
 * 設計:
 *   - モック/本番の分岐はサーバー側（/api/pipeline/preview-extract）で統一管理
 *     Phase 3（2026-05-03）でフロント側のVITE_USE_MOCK分岐を廃止
 *   - バリデーションはサーバー側（previewExtract.service.ts → validatePreviewExtractResult.ts）で実行
 *   - フロントはAPIレスポンスのvalidation結果を信頼して表示するだけ
 *   - ReceiptAnalysisResult / AnalyzeOptions → types.ts からimport
 *   - any排除: PreviewExtractResponse型でAPIレスポンスを受け取る
 *   - MIME定数: fileTypes.ts からimport
 */

import type {
  PreviewExtractResponse,
  PreviewExtractLineItem,
  ReceiptAnalysisResult,
  AnalyzeOptions,
} from '@/api/services/pipeline/types';
import { validateFileType } from '@/shared/fileTypes';
import {
  serverErrorMessage,
  networkErrorMessage,
} from '@/shared/validationMessages';

// 型の再export（Vue側のimportパスを変更しないための互換性維持）
export type { ReceiptAnalysisResult, AnalyzeOptions };



// ===== API実装（/api/pipeline/preview-extract） =====
// Phase 3: サーバー側でモック/本番を自動切替するため、常にこのパスを使用
async function analyzeReceiptReal(file: File, clientId?: string): Promise<ReceiptAnalysisResult> {
  try {
    // ① ファイル形式チェック（AI不要なら補助対象として即返却 → Geminiコスト発生ゼロ）
    const fileCategory = validateFileType(file);
    if (fileCategory === "supplementary") {
      return {
        ok: true,
        date: null,
        amount: null,
        vendor: null,
        errorReason: null,
        supplementary: true,
      };
    }

    // ② ファイルサイズ制限（10MB。Android端末のメモリ保護）
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_FILE_SIZE) {
      return {
        ok: false,
        date: null,
        amount: null,
        vendor: null,
        errorReason: `ファイルサイズが大きすぎます（${(file.size / 1024 / 1024).toFixed(1)}MB）。10MB以下にしてください`,
      };
    }

    // ③ FormData送信（フロントではbase64変換・SHA-256計算を行わない。サーバーで実施）
    const formData = new FormData();
    formData.append('file', file);
    formData.append('mimeType', file.type || 'image/jpeg');
    formData.append('clientId', clientId ?? 'unknown');
    formData.append('filename', file.name);

    const response = await fetch("/api/pipeline/preview-extract", {
      method: "POST",
      body: formData,  // Content-Typeは自動設定（multipart/form-data）
    });

    if (!response.ok) {
      return {
        ok: false,
        date: null,
        amount: null,
        vendor: null,
        errorReason: serverErrorMessage(response.status),
      };
    }

    // ③ 型安全なレスポンス取得（D-1解消: any排除）
    const data: PreviewExtractResponse & { fileUrl?: string } = await response.json();

    // ④ メトリクス構築（型安全: PreviewExtractResponseのフィールドを直接参照）
    const metrics: ReceiptAnalysisResult['metrics'] = {
      source_type: data.source_type,
      source_type_confidence: data.source_type_confidence,
      direction: data.direction,
      direction_confidence: data.direction_confidence,
      processing_mode: data.processing_mode,
      preview_extract_reason: data.preview_extract_reason ?? null,
      description: data.description ?? null,
      fallback_applied: data.fallback_applied,
      duration_ms: data.metadata.duration_ms,
      duration_seconds: data.metadata.duration_seconds,
      prompt_tokens: data.metadata.prompt_tokens,
      completion_tokens: data.metadata.completion_tokens,
      thinking_tokens: data.metadata.thinking_tokens,
      token_count: data.metadata.token_count,
      cost_yen: data.metadata.cost_yen,
      model: data.metadata.model,
      original_size_kb: data.metadata.original_size_kb,
      processed_size_kb: data.metadata.processed_size_kb,
      preprocess_reduction_pct: data.metadata.preprocess_reduction_pct,
    };

    // ⑤ 行データ取得（D-2解消: PreviewExtractLineItem型で型安全）
    const lineItems = data.line_items.map((li: PreviewExtractLineItem) => ({
      line_index: li.line_index,
      date: li.date,
      description: li.description,
      amount: li.amount,
      direction: li.direction,
      balance: li.balance,
      // Step4-C: 科目確定結果をフロントに透過
      vendor_id: li.vendor_id ?? null,
      vendor_name: li.vendor_name ?? null,
      determined_account: li.determined_account ?? null,
      tax_category: li.tax_category ?? null,
      sub_account: li.sub_account ?? null,
      department: li.department ?? null,
      rule_id: li.rule_id ?? null,
      level: li.level,
      prediction_method: li.prediction_method ?? null,
      candidates: li.candidates ?? [],
    }));

    // ⑥ サーバー側バリデーション結果を使う
    // ただし fallback_applied=true（AI失敗）の場合はエラーとして返す
    // 正規の補助対象（CSV等のファイル形式判定）とは区別する
    if (data.fallback_applied) {
      return {
        ok: false,
        date: null,
        amount: null,
        vendor: null,
        errorReason: 'AI分析に失敗しました（サーバー側エラー）',
        metrics,
        fileHash: data.fileHash,
        fileUrl: data.fileUrl,
      };
    }

    return {
      ok: data.validation.ok,
      date: data.date,
      amount: data.total_amount,
      vendor: data.issuer_name,
      errorReason: data.validation.errorReason,
      supplementary: data.validation.supplementary,
      warning: data.validation.warning,
      isDuplicate: data.validation.isDuplicate,
      documentCount: data.document_count,
      lineItems,
      metrics,
      fileHash: data.fileHash,
      fileUrl: data.fileUrl,
    };
  } catch (err) {
    return {
      ok: false,
      date: null,
      amount: null,
      vendor: null,
      errorReason: networkErrorMessage(err instanceof Error ? err.message : String(err)),
    };
  }
}

/** テスト用: previewExtract結果をコンソールに全項目構造化出力 */
function logPreviewExtractResult(file: File, opts: AnalyzeOptions, result: ReceiptAnalysisResult) {
  const m = result.metrics;
  const DIRECTION_LABELS: Record<string, string> = {
    expense: "支払",
    income: "入金",
    transfer: "振替",
    mixed: "混在",
    unknown: "不明",
  };
  const MODE_LABELS: Record<string, string> = {
    auto: "自動仕訳",
    manual: "手動仕訳",
    excluded: "除外",
    unknown: "不明",
  };
  const fallbackLabel = m?.fallback_applied
    ? "あり（デフォルト値に置換）"
    : "なし（AIが正常に処理）";

  const lines = result.lineItems ?? [];

  const ub = opts.uploadedBy;
  console.log(
    `\n═══ previewExtract結果 [${file.name}] ═══\n` +
      `▼ フロント情報\n` +
      `  顧問先ID     : ${opts.clientId ?? "-"}\n` +
      `  証票ID       : ${opts.documentId ?? "-"}\n` +
      `  権限         : ${opts.role ?? "-"}（${opts.role === "staff" ? "事務所スタッフ" : opts.role === "guest" ? "顧問先ゲスト" : "-"}）\n` +
      `  端末         : ${opts.device ?? "-"}（${opts.device === "pc" ? "PC" : opts.device === "mobile" ? "スマホ" : "-"}）\n` +
      `  アップロード者: ${ub?.staffName ?? "(不明)"} (ID: ${ub?.staffId ?? "-"}, Email: ${ub?.email ?? "-"})\n` +
      `  ファイル名   : ${file.name}\n` +
      `  ファイル形式 : ${file.type || "-"}\n` +
      `  ファイルサイズ : ${Math.round(file.size / 1024)}KB (${file.size.toLocaleString()}バイト)\n` +
      `▼ AIレスポンス\n` +
      `  OK/NG        : ${result.ok ? "✅ OK" : "❌ NG"} ${result.errorReason ? `(理由: ${result.errorReason})` : ""}\n` +
      `  証票種別     : ${m?.source_type ?? "-"}\n` +
      `  種別信頼度   : ${m?.source_type_confidence != null ? `${(m.source_type_confidence * 100).toFixed(0)}%` : "-"}\n` +
      `  仕訳方向     : ${m?.direction ?? "-"}（${DIRECTION_LABELS[m?.direction ?? ""] ?? "-"}）\n` +
      `  方向信頼度   : ${m?.direction_confidence != null ? `${(m.direction_confidence * 100).toFixed(0)}%` : "-"}\n` +
      `  処理モード   : ${m?.processing_mode ?? "-"}（${MODE_LABELS[m?.processing_mode ?? ""] ?? "-"}）\n` +
      `  日付         : ${result.date ?? "null"}\n` +
      `  金額         : ${result.amount != null ? `¥${result.amount.toLocaleString()}` : "null"}\n` +
      `  取引先       : ${result.vendor ?? "null"}\n` +
      `  摘要         : ${m?.description ?? "null"}\n` +
      `  判定根拠     : ${m?.preview_extract_reason ?? "-"}\n` +
      `  fallback     : ${fallbackLabel}\n` +
      `▼ メトリクス\n` +
      `  処理時間     : ${m?.duration_seconds ?? "-"}秒 (${m?.duration_ms ?? "-"}ms)\n` +
      `  入力トークン : ${m?.prompt_tokens ?? "-"}\n` +
      `  出力トークン : ${m?.completion_tokens ?? "-"}\n` +
      `  思考トークン : ${m?.thinking_tokens ?? "-"}\n` +
      `  トークン合計 : ${m?.token_count ?? "-"}\n` +
      `  コスト       : ¥${m?.cost_yen?.toFixed(4) ?? "-"}\n` +
      `  モデル       : ${m?.model ?? "-"}\n` +
      `▼ 前処理\n` +
      `  元サイズ     : ${m?.original_size_kb ?? "-"}KB\n` +
      `  圧縮後       : ${m?.processed_size_kb ?? "-"}KB\n` +
      `  削減率       : ${m?.preprocess_reduction_pct ?? "-"}%\n` +
      `▼ 行データ（${lines.length}行）\n` +
      (lines.length === 0
        ? `  (行データなし)\n`
        : lines
            .map((li) => {
              const lineId = opts.documentId ? `${opts.documentId}_line-${li.line_index}` : "-";
              const dir = li.direction === "income" ? "入金" : "支払";
              const bal = li.balance != null ? `残高:¥${li.balance.toLocaleString()}` : "";
              return (
                `  [${li.line_index}] ${li.date ?? "----/--/--"} | ${dir} | ¥${li.amount.toLocaleString()} | ${li.description} ${bal}\n` +
                `       line_id: ${lineId}\n`
              );
            })
            .join("")) +
      `════════════════════════════════════\n`,
  );
}

// ===== エクスポート =====
// Phase 3: VITE_USE_MOCK分岐をサーバー側に移動。フロントは常にanalyzeReceiptRealを使用。

export const analyzeReceipt = async (
  file: File,
  opts?: AnalyzeOptions,
): Promise<ReceiptAnalysisResult> => {
  const result = await analyzeReceiptReal(file, opts?.clientId);
  // テスト用: ブラウザコンソールに全項目構造化出力
  logPreviewExtractResult(file, opts ?? {}, result);
  return result;
};
