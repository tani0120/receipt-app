/**
 * Phase A-2 v2: 証票 前処理パイプライン
 *
 * 画像/PDF/CSVを一括処理し、Vertex AI送信用のparts配列を構築する。
 *
 * 処理ルート:
 *   - 画像(.jpg/.png/.webp/.heic): sharp pipeline → JPEG Buffer
 *   - PDF(.pdf): 直送（Geminiが直接読める。ページ分解不要）
 *   - CSV(.csv): Shift-JIS→UTF-8変換 → テキスト
 *
 * sharp pipeline:
 *   1. rotate()       — EXIF回転補正
 *   2. resize(2000)   — 横幅2000px上限
 *   3. grayscale()    — 白黒化
 *   4. normalize()    — コントラスト正規化
 *   5. sharpen(1.0)   — 文字エッジ強調
 *   6. jpeg(85)       — JPEG出力
 *
 * A/Bテスト対応:
 *   enablePreprocess=false で生画像直送（前処理スキップ）
 *
 * 使い方:
 *   import { processFile, processFiles } from './preprocess';
 *   const parts = await processFiles(filePaths, { enablePreprocess: true });
 */

import * as fs from 'fs';
import * as path from 'path';
import * as iconv from 'iconv-lite';
import { preprocessImage as sharpPreprocess, getMimeType as getSharpMimeType } from '../api/services/pipeline/image_preprocessor';

// ============================================================
// 型定義
// ============================================================

import type { Part } from '@google/genai';

/** 前処理オプション */
export interface PreprocessOptions {
    /** 前処理を有効にするか（false=生ファイル直送） */
    enablePreprocess: boolean;
    /** 画像の横幅上限 */
    maxWidth?: number;
    /** JPEG品質（1-100） */
    jpegQuality?: number;
    /** sharpenのsigma値 */
    sharpenSigma?: number;
}

const DEFAULT_OPTIONS: Required<PreprocessOptions> = {
    enablePreprocess: true,
    maxWidth: 2000,
    jpegQuality: 85,
    sharpenSigma: 1.0,
};

/** ファイル種別 */
type FileCategory = 'image' | 'pdf' | 'csv' | 'unknown';

// ============================================================
// ユーティリティ
// ============================================================

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.webp', '.heic'];
const PDF_EXTENSIONS = ['.pdf'];
const CSV_EXTENSIONS = ['.csv'];

function categorizeFile(filePath: string): FileCategory {
    const ext = path.extname(filePath).toLowerCase();
    if (IMAGE_EXTENSIONS.includes(ext)) return 'image';
    if (PDF_EXTENSIONS.includes(ext)) return 'pdf';
    if (CSV_EXTENSIONS.includes(ext)) return 'csv';
    return 'unknown';
}

function getImageMimeType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const mimeMap: Record<string, string> = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.bmp': 'image/bmp',
        '.tiff': 'image/tiff',
        '.webp': 'image/webp',
        '.heic': 'image/heic',
    };
    return mimeMap[ext] || 'image/jpeg';
}

// ============================================================
// 画像前処理 → image_preprocessor.ts に委譲
// ============================================================

// ============================================================
// CSV前処理
// ============================================================

/**
 * CSVをShift-JIS/UTF-8自動判定してUTF-8テキストに変換
 */
function preprocessCsv(filePath: string): string {
    const rawBuffer = fs.readFileSync(filePath);

    // BOMチェック: UTF-8 BOMがあればUTF-8として処理
    if (rawBuffer[0] === 0xEF && rawBuffer[1] === 0xBB && rawBuffer[2] === 0xBF) {
        return rawBuffer.toString('utf-8').trim();
    }

    // Shift-JISの可能性を検出（0x80以上のバイトがあればShift-JISと仮定）
    const hasHighBytes = rawBuffer.some(b => b > 0x7F);
    if (hasHighBytes) {
        try {
            const decoded = iconv.decode(rawBuffer, 'Shift_JIS');
            return decoded.trim();
        } catch {
            // fallback to UTF-8
        }
    }

    return rawBuffer.toString('utf-8').trim();
}

// ============================================================
// メインAPI
// ============================================================

export interface ProcessedFile {
    fileName: string;
    category: FileCategory;
    part: Part;
    originalSize: number;
    processedSize: number;
    preprocessed: boolean;
}

/**
 * 1ファイルを処理してVertex AI用のPartを返す
 */
export async function processFile(
    filePath: string,
    options?: Partial<PreprocessOptions>
): Promise<ProcessedFile> {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const fileName = path.basename(filePath);
    const category = categorizeFile(filePath);
    const originalSize = fs.statSync(filePath).size;

    switch (category) {
        case 'image': {
            const rawBuffer = fs.readFileSync(filePath);

            if (opts.enablePreprocess) {
                const mime = getSharpMimeType(filePath);
                const ppResult = await sharpPreprocess(rawBuffer, mime, {
                    maxLongEdge: opts.maxWidth,
                    jpegQuality: opts.jpegQuality,
                    sharpenSigma: opts.sharpenSigma,
                });
                return {
                    fileName,
                    category,
                    part: {
                        inlineData: {
                            mimeType: ppResult.mimeType,
                            data: ppResult.base64,
                        },
                    },
                    originalSize,
                    processedSize: ppResult.buffer.length,
                    preprocessed: true,
                };
            } else {
                // 生画像直送
                return {
                    fileName,
                    category,
                    part: {
                        inlineData: {
                            mimeType: getImageMimeType(filePath),
                            data: rawBuffer.toString('base64'),
                        },
                    },
                    originalSize,
                    processedSize: rawBuffer.length,
                    preprocessed: false,
                };
            }
        }

        case 'pdf': {
            // PDFはGeminiが直接読めるので、前処理の有無に関わらず直送
            const rawBuffer = fs.readFileSync(filePath);
            return {
                fileName,
                category,
                part: {
                    inlineData: {
                        mimeType: 'application/pdf',
                        data: rawBuffer.toString('base64'),
                    },
                },
                originalSize,
                processedSize: rawBuffer.length,
                preprocessed: false,  // PDFは常に未処理
            };
        }

        case 'csv': {
            const csvText = preprocessCsv(filePath);
            const header = '--- CSV DATA START ---';
            const footer = '--- CSV DATA END ---';
            const fullText = `${header}\n${csvText}\n${footer}`;
            return {
                fileName,
                category,
                part: { text: fullText },
                originalSize,
                processedSize: Buffer.byteLength(fullText, 'utf-8'),
                preprocessed: true,  // CSVは常に処理済み
            };
        }

        default:
            throw new Error(`未対応のファイル形式: ${filePath}`);
    }
}

/**
 * 複数ファイルを処理してPart配列を返す
 */
export async function processFiles(
    filePaths: string[],
    options?: Partial<PreprocessOptions>
): Promise<ProcessedFile[]> {
    const results: ProcessedFile[] = [];
    for (const fp of filePaths) {
        const result = await processFile(fp, options);
        results.push(result);
    }
    return results;
}

// ============================================================
// スタンドアロン実行（npx tsx src/scripts/preprocess.ts）
// ============================================================

async function main() {
    const { fileURLToPath } = await import('url');
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    const INPUT_DIR = path.join(__dirname, 'test_images');

    if (!fs.existsSync(INPUT_DIR)) {
        console.error(`❌ テスト画像ディレクトリが見つかりません: ${INPUT_DIR}`);
        process.exit(1);
    }

    const allExtensions = [...IMAGE_EXTENSIONS, ...PDF_EXTENSIONS, ...CSV_EXTENSIONS];
    const files = fs.readdirSync(INPUT_DIR)
        .filter(f => allExtensions.includes(path.extname(f).toLowerCase()))
        .sort();

    console.log('=== 前処理パイプライン ===');
    console.log(`入力: ${INPUT_DIR}`);
    console.log(`対象ファイル: ${files.length}件\n`);

    for (const file of files) {
        const filePath = path.join(INPUT_DIR, file);
        try {
            const startTime = Date.now();
            const result = await processFile(filePath, { enablePreprocess: true });
            const duration = Date.now() - startTime;

            const reduction = ((1 - result.processedSize / result.originalSize) * 100).toFixed(0);
            console.log(`✅ ${file} [${result.category}]`);
            console.log(`   ${(result.originalSize / 1024).toFixed(0)}KB → ${(result.processedSize / 1024).toFixed(0)}KB (${reduction}%削減, ${duration}ms)`);
        } catch (err) {
            console.error(`❌ ${file}: ${err}`);
        }
    }

    console.log('\n=== 完了 ===');
}

// ESM環境でのスタンドアロン実行判定
const isMainModule = process.argv[1]?.includes('preprocess');
if (isMainModule) {
    main().catch(console.error);
}
