/**
 * image_preprocessor.ts — 画像前処理モジュール（正規版）
 *
 * 役割:
 *   パイプラインの最初段で画像を標準化する。
 *   Vision OCR / Geminiへの入力品質を向上させることが目的。
 *
 * 確定パイプライン（draft_2_with_preprocess テスト実績あり）:
 *   ① EXIF自動回転補正  — カメラ縦横情報を実際の向きに反映
 *   ② リサイズ          — 長辺2000px以内（アスペクト比維持）
 *   ③ 白黒化            — grayscale()（カラー情報を除去しOCR精度向上）
 *   ④ コントラスト正規化 — normalize()（ヒストグラム均等化）
 *   ⑤ エッジ強調        — sharpen(sigma=1.0)（文字エッジ強調）
 *   ⑥ JPEG出力          — jpeg(quality=85)
 *
 * 傾き補正（deskew）について:
 *   sharp は deskew 非対応。
 *   Google Vision Document AI がOCR時にページ回転情報（pageTransforms.rotation）を
 *   返すため、OCR呼び出し層で対応する。本モジュールのスコープ外。
 *
 * 出力:
 *   - Buffer（JPEG, 品質85）
 *   - PreprocessResult（適用した処理の記録・元サイズ・変換後サイズ）
 *
 * 使い方:
 *   const result = await preprocessImage(fileBuffer, 'image/jpeg');
 *   // result.buffer → Vision OCR / Gemini に渡す
 *   // result.base64 → API直接渡し用
 *   // result.applied → トレースログに記録
 *
 * 呼び出し元:
 *   - previewExtract.service.ts（API経由のpreviewExtract）
 *   - preprocess.ts（バッチ処理）
 *
 * 移動履歴:
 *   2026-05-05: scripts/pipeline/image_preprocessor.ts → api/services/pipeline/image_preprocessor.ts
 *   理由: プロダクションAPI（previewExtract.service.ts）が直接importしているため、
 *         api/services/pipeline/ に配置するのが適切。
 */

import sharp from 'sharp';
import * as path from 'path';
import * as fs from 'fs';

// ============================================================
// 定数
// ============================================================

/** 長辺の最大ピクセル数（テスト実績: 2000px） */
const MAX_LONG_EDGE = 2000;

/** JPEG出力品質（85: 品質とファイルサイズのバランス） */
const JPEG_QUALITY = 85;

/** sharpenのsigma値（1.0: 文字エッジの適度な強調） */
const SHARPEN_SIGMA = 1.0;

// ============================================================
// 型定義
// ============================================================

export type MimeType =
  | 'image/jpeg'
  | 'image/jpg'
  | 'image/png'
  | 'image/webp'
  | 'image/tiff'
  | 'application/pdf'; // PDF は別処理（本モジュールはスキップ）

export interface ImageSize {
  width: number;
  height: number;
}

/** 各前処理ステップの適用フラグ */
export interface AppliedSteps {
  exifRotation: boolean;  // ① EXIF回転
  resize: boolean;        // ② リサイズ
  grayscale: boolean;     // ③ 白黒化
  normalize: boolean;     // ④ コントラスト正規化
  sharpen: boolean;       // ⑤ エッジ強調
}

/** 前処理の結果 */
export interface PreprocessResult {
  /** 前処理後の画像データ（JPEG Buffer） */
  buffer: Buffer;
  /** base64エンコード済み文字列（Gemini/Vision API直接渡し用） */
  base64: string;
  /** 出力MIMEタイプ（画像: image/jpeg、PDF: application/pdf） */
  mimeType: 'image/jpeg' | 'application/pdf';
  /** 処理前の画像サイズ */
  originalSize: ImageSize;
  /** 処理後の画像サイズ */
  processedSize: ImageSize;
  /** 適用された処理のリスト */
  applied: AppliedSteps;
  /** 処理時間（ms） */
  durationMs: number;
}

/** 前処理オプション */
export interface PreprocessOptions {
  /** リサイズの最大長辺（デフォルト: 2000） */
  maxLongEdge?: number;
  /** JPEG出力品質（デフォルト: 85） */
  jpegQuality?: number;
  /** sharpenのsigma値（デフォルト: 1.0） */
  sharpenSigma?: number;
}

// ============================================================
// メイン関数
// ============================================================

/**
 * 画像を前処理する（確定パイプライン: 6ステップ）
 *
 * パイプライン:
 *   ① rotate()           — EXIF自動回転補正
 *   ② resize(長辺2000px) — 長辺基準・アスペクト比維持
 *   ③ grayscale()        — 白黒化
 *   ④ normalize()        — コントラスト正規化
 *   ⑤ sharpen(sigma=1.0) — 文字エッジ強調
 *   ⑥ jpeg(quality=85)   — JPEG出力
 *
 * @param input  画像データ（Buffer または ファイルパス文字列）
 * @param mime   MIMEタイプ
 * @param options 前処理オプション（省略可）
 * @returns      PreprocessResult
 *
 * @example
 * ```ts
 * const buf = fs.readFileSync('receipt.jpg');
 * const result = await preprocessImage(buf, 'image/jpeg');
 * // Vision OCR に渡す場合:
 * const base64 = result.base64;
 * // トレースログに記録:
 * console.log(result.applied);
 * // → { exifRotation: true, resize: true, grayscale: true, normalize: true, sharpen: true }
 * ```
 */
export async function preprocessImage(
  input: Buffer | string,
  mime: MimeType,
  options: PreprocessOptions = {},
): Promise<PreprocessResult> {
  const startMs = Date.now();

  const maxLongEdge = options.maxLongEdge ?? MAX_LONG_EDGE;
  const jpegQuality = options.jpegQuality ?? JPEG_QUALITY;
  const sharpenSigma = options.sharpenSigma ?? SHARPEN_SIGMA;

  // PDF は前処理スキップ（Geminiが直接読める → MIMEタイプをそのまま保持）
  if (mime === 'application/pdf') {
    const buf = typeof input === 'string' ? fs.readFileSync(input) : input;
    return {
      buffer: buf,
      base64: buf.toString('base64'),
      mimeType: 'application/pdf',
      originalSize: { width: 0, height: 0 },
      processedSize: { width: 0, height: 0 },
      applied: { exifRotation: false, resize: false, grayscale: false, normalize: false, sharpen: false },
      durationMs: Date.now() - startMs,
    };
  }

  // sharpインスタンス作成
  const pipeline = sharp(input);

  // 元サイズ取得
  const metadata = await pipeline.metadata();
  const originalWidth = metadata.width ?? 0;
  const originalHeight = metadata.height ?? 0;

  const applied: AppliedSteps = {
    exifRotation: false,
    resize: false,
    grayscale: false,
    normalize: false,
    sharpen: false,
  };

  // ===========================================================
  // ① EXIF自動回転補正
  // ===========================================================
  // スマホで撮影した画像はEXIFに回転情報が入っているが、
  // 表示ソフトが補正するため「見た目は正しい」が実際のピクセルは横になっている。
  // Vision OCR / Gemini はEXIFを無視してピクセルを読むため、必ず補正が必要。
  pipeline.rotate(); // EXIFに基づいて自動回転
  applied.exifRotation = true;

  // ===========================================================
  // ② リサイズ（長辺2000px以内、アスペクト比維持）
  // ===========================================================
  // 長辺基準: 縦長レシートでも横長通帳でも統一的にサイズ制限
  const longEdge = Math.max(originalWidth, originalHeight);
  if (longEdge > maxLongEdge) {
    pipeline.resize({
      width: originalWidth >= originalHeight ? maxLongEdge : undefined,
      height: originalHeight > originalWidth ? maxLongEdge : undefined,
      fit: 'inside',            // アスペクト比維持
      withoutEnlargement: true, // 小さい画像は拡大しない
    });
    applied.resize = true;
  }

  // ===========================================================
  // ③ 白黒化（grayscale）
  // ===========================================================
  // レシート・証票はカラー情報に意味がない。
  // ファイルサイズが約1/3になりAPI転送コスト削減。
  // normalize・sharpenと組み合わせてOCR精度向上。
  pipeline.grayscale();
  applied.grayscale = true;

  // ===========================================================
  // ④ コントラスト正規化（normalize）
  // ===========================================================
  // ヒストグラム正規化 → 暗すぎ・明るすぎ画像を自動補正
  // 対象: レシート（感熱紙の薄い印字）、手書き文書など
  pipeline.normalize();
  applied.normalize = true;

  // ===========================================================
  // ⑤ エッジ強調（sharpen）
  // ===========================================================
  // sigma=1.0: 文字エッジの適度な強調（過剰強調なし）
  // かすれた感熱紙の文字エッジを際立たせてOCR精度向上
  pipeline.sharpen({ sigma: sharpenSigma });
  applied.sharpen = true;

  // ===========================================================
  // ⑥ 出力（JPEG変換）
  // ===========================================================
  const outputBuffer = await pipeline
    .jpeg({ quality: jpegQuality, mozjpeg: false })
    .toBuffer({ resolveWithObject: true });

  const processedWidth = outputBuffer.info.width;
  const processedHeight = outputBuffer.info.height;

  return {
    buffer: outputBuffer.data,
    base64: outputBuffer.data.toString('base64'),
    mimeType: 'image/jpeg',
    originalSize: { width: originalWidth, height: originalHeight },
    processedSize: { width: processedWidth, height: processedHeight },
    applied,
    durationMs: Date.now() - startMs,
  };
}

// ============================================================
// ユーティリティ関数
// ============================================================

/**
 * ファイル拡張子からMIMEタイプを推定する
 */
export function getMimeType(filePath: string): MimeType {
  const ext = path.extname(filePath).toLowerCase();
  const mimeMap: Record<string, MimeType> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.tiff': 'image/tiff',
    '.tif': 'image/tiff',
    '.pdf': 'application/pdf',
  };
  return mimeMap[ext] ?? 'image/jpeg';
}

/**
 * 前処理結果をログ出力する（デバッグ用）
 */
export function logPreprocessResult(result: PreprocessResult, fileName: string): void {
  const ratio = result.originalSize.width > 0
    ? (result.processedSize.width / result.originalSize.width * 100).toFixed(0)
    : '?';

  const steps = [
    result.applied.exifRotation ? 'EXIF回転' : null,
    result.applied.resize ? `リサイズ(${ratio}%)` : 'リサイズ不要',
    result.applied.grayscale ? '白黒化' : null,
    result.applied.normalize ? 'コントラスト正規化' : null,
    result.applied.sharpen ? 'エッジ強調' : null,
  ].filter(Boolean).join(' → ');

  console.log(
    `[前処理] ${fileName}: ` +
    `${result.originalSize.width}×${result.originalSize.height}px → ` +
    `${result.processedSize.width}×${result.processedSize.height}px | ` +
    `${steps} | ${result.durationMs}ms`
  );
}
