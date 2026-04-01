/**
 * image_preprocessor.ts — 画像前処理モジュール
 *
 * 役割:
 *   パイプラインの最初段で画像を標準化する。
 *   Vision OCR / Geminiへの入力品質を向上させることが目的。
 *
 * 処理内容（適用順）:
 *   ① EXIF自動回転補正  — カメラ縦横情報を実際の向きに反映
 *   ② リサイズ          — 長辺1400px以内（アスペクト比維持）
 *   ③ コントラスト補正  — normalize() + gamma補正（薄いレシート対策）
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
 *   // result.applied → トレースログに記録
 */

import sharp from 'sharp';
import * as path from 'path';
import * as fs from 'fs';

// ============================================================
// 定数
// ============================================================

/** 長辺の最大ピクセル数 */
const MAX_LONG_EDGE = 1400;

/** JPEG出力品質（85: 品質とファイルサイズのバランス） */
const JPEG_QUALITY = 85;

/**
 * コントラスト補正のガンマ値
 * 1.0 = 補正なし
 * 1.5 = 暗部を明るく（薄いレシート印字の視認性向上）
 * 2.0 = 強め（手書き・劣化した書類向け）
 */
const GAMMA_VALUE = 1.5;

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
  contrast: boolean;      // ③ コントラスト補正
}

/** 前処理の結果 */
export interface PreprocessResult {
  /** 前処理後の画像データ（JPEG Buffer） */
  buffer: Buffer;
  /** base64エンコード済み文字列（Gemini/Vision API直接渡し用） */
  base64: string;
  /** 出力MIMEタイプ（常にimage/jpeg） */
  mimeType: 'image/jpeg';
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
  /** リサイズの最大長辺（デフォルト: 1400） */
  maxLongEdge?: number;
  /** JPEG出力品質（デフォルト: 85） */
  jpegQuality?: number;
  /** ガンマ補正値（デフォルト: 1.5 / 1.0で無効） */
  gamma?: number;
  /** コントラスト補正を有効にするか（デフォルト: true） */
  enableContrast?: boolean;
}

// ============================================================
// メイン関数
// ============================================================

/**
 * 画像を前処理する
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
 * console.log(result.applied); // { exifRotation: true, resize: true, contrast: true }
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
  const gamma = options.gamma ?? GAMMA_VALUE;
  const enableContrast = options.enableContrast ?? true;

  // PDF は前処理スキップ（別ライブラリで対応）
  if (mime === 'application/pdf') {
    const buf = typeof input === 'string' ? fs.readFileSync(input) : input;
    return {
      buffer: buf,
      base64: buf.toString('base64'),
      mimeType: 'image/jpeg',
      originalSize: { width: 0, height: 0 },
      processedSize: { width: 0, height: 0 },
      applied: { exifRotation: false, resize: false, contrast: false },
      durationMs: Date.now() - startMs,
    };
  }

  // sharpインスタンス作成
  let pipeline = sharp(input);

  // 元サイズ取得
  const metadata = await pipeline.metadata();
  const originalWidth = metadata.width ?? 0;
  const originalHeight = metadata.height ?? 0;

  const applied: AppliedSteps = {
    exifRotation: false,
    resize: false,
    contrast: false,
  };

  // ===========================================================
  // ① EXIF自動回転補正
  // ===========================================================
  // スマホで撮影した画像はEXIFに回転情報が入っているが、
  // 表示ソフトが補正するため「見た目は正しい」が実際のピクセルは横になっている。
  // Vision OCR / Gemini はEXIFを無視してピクセルを読むため、必ず補正が必要。
  pipeline = pipeline.rotate(); // EXIFに基づいて自動回転
  applied.exifRotation = true;

  // ===========================================================
  // ② リサイズ（長辺1400px以内、アスペクト比維持）
  // ===========================================================
  const longEdge = Math.max(originalWidth, originalHeight);
  if (longEdge > maxLongEdge) {
    pipeline = pipeline.resize({
      width: originalWidth >= originalHeight ? maxLongEdge : undefined,
      height: originalHeight > originalWidth ? maxLongEdge : undefined,
      fit: 'inside',          // アスペクト比維持
      withoutEnlargement: true, // 小さい画像は拡大しない
    });
    applied.resize = true;
  }

  // ===========================================================
  // ③ コントラスト補正
  // ===========================================================
  // normalize(): ヒストグラム正規化 → 暗すぎ・明るすぎ画像を自動補正
  // gamma():     ガンマ補正 → 暗部を持ち上げて薄い文字を見やすくする
  //
  // 対象: レシート（感熱紙の薄い印字）、手書き文書など
  // 注意: gamma(1.0) は変換なし。値が大きいほど暗部が明るくなる。
  if (enableContrast) {
    pipeline = pipeline
      .normalize()       // ヒストグラム正規化（コントラスト自動最大化）
      .gamma(gamma);     // ガンマ補正（暗部強調）
    applied.contrast = true;
  }

  // ===========================================================
  // 出力（JPEG変換）
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
    result.applied.contrast ? 'コントラスト補正' : null,
  ].filter(Boolean).join(' → ');

  console.log(
    `[前処理] ${fileName}: ` +
    `${result.originalSize.width}×${result.originalSize.height}px → ` +
    `${result.processedSize.width}×${result.processedSize.height}px | ` +
    `${steps} | ${result.durationMs}ms`
  );
}
