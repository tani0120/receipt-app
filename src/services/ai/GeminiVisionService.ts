import type { JournalEntryDraft, FileType } from '@/features/journal';
import type { Client } from '@/features/client';
import { JournalEntryDraftSchema } from '@/features/journal';
import { JournalSemanticGuard, NormalizationService } from '@/features/journal';
import { FileTypeDetector } from './FileTypeDetector';

/**
 * Gemini Vision API連携サービス
 *
 * Phase 1実装:
 * - ファイル形式自動判定
 * - 仕訳データ生成
 * - エラー再試行（最大3回）
 * - 正規化処理
 */
export class GeminiVisionService {

    /**
     * ファイルを処理（形式判定 + 仕訳生成）
     *
     * @param imageBase64 Base64エンコードされた画像
     * @param client 顧問先情報
     * @param maxRetries 最大再試行回数（デフォルト: 3）
     * @returns ファイル形式と仕訳データ
     */
    static async processFile(
        imageBase64: string,
        client: Partial<Client>,
        maxRetries: number = 3
    ): Promise<{
        fileType: FileType;
        journalEntry: JournalEntryDraft | null;
    }> {

        // 1. プロンプトを構築
        const prompt = FileTypeDetector.buildPrompt(client);

        // 2. 再試行ロジック
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                // 3. Gemini Vision APIを呼び出し
                const response = await fetch(
                    process.env.NEXT_PUBLIC_GEMINI_API_ENDPOINT ||
                    'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent',
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-goog-api-key': process.env.NEXT_PUBLIC_GEMINI_API_KEY || ''
                        },
                        body: JSON.stringify({
                            contents: [{
                                parts: [
                                    { text: prompt },
                                    {
                                        inline_data: {
                                            mime_type: 'image/jpeg',
                                            data: imageBase64
                                        }
                                    }
                                ]
                            }],
                            generationConfig: {
                                temperature: 0.2,  // 再現性を高める
                                maxOutputTokens: 4096
                            }
                        })
                    }
                );

                if (!response.ok) {
                    throw new Error(`Gemini API Error: ${response.statusText}`);
                }

                // 4. レスポンスをパース
                const result = await response.json();
                const jsonText = result.candidates[0].content.parts[0].text;

                // JSON以外のテキストを除去（例: "```json"等）
                const cleanedJson = jsonText
                    .replace(/```json\n?/g, '')
                    .replace(/```\n?/g, '')
                    .trim();

                const parsed = JSON.parse(cleanedJson);

                // 5. ファイル形式を確認
                if (parsed.fileType === 'OTHER_NON_JOURNAL') {
                    // 仕訳に関係しない → null返す
                    return {
                        fileType: 'OTHER_NON_JOURNAL',
                        journalEntry: null
                    };
                }

                // 6. 仕訳データを正規化
                if (parsed.journalEntry) {
                    // 取引先名の正規化
                    if (parsed.journalEntry.lines && Array.isArray(parsed.journalEntry.lines)) {
                        parsed.journalEntry.lines.forEach((line: unknown) => {
                            if (typeof line === 'object' && line !== null && 'vendorNameRaw' in line) {
                                const typedLine = line as { vendorNameRaw?: string; vendorName?: string };
                                if (typedLine.vendorNameRaw) {
                                    typedLine.vendorName = NormalizationService.normalizeVendorName(typedLine.vendorNameRaw);
                                }
                            }
                        });
                    }

                    // 摘要の正規化
                    if (parsed.journalEntry.description) {
                        parsed.journalEntry.description = NormalizationService.normalizeDescription(
                            parsed.journalEntry.description
                        );
                    }

                    // 必須フィールドを設定
                    parsed.journalEntry.id = crypto.randomUUID();
                    parsed.journalEntry.status = 'Draft';
                    parsed.journalEntry.clientId = client.id || '';
                    parsed.journalEntry.clientCode = client.clientCode || '';
                    parsed.journalEntry.createdAt = new Date().toISOString();
                    parsed.journalEntry.createdBy = 'system';
                    parsed.journalEntry.updatedAt = new Date().toISOString();

                    // 各行にlineIdを設定
                    if (parsed.journalEntry.lines && Array.isArray(parsed.journalEntry.lines)) {
                        parsed.journalEntry.lines.forEach((line: unknown) => {
                            if (typeof line === 'object' && line !== null) {
                                (line as { lineId?: string }).lineId = crypto.randomUUID();
                            }
                        });
                    }
                }

                // 7. スキーマ検証（.strict()モード）
                const validated = JournalEntryDraftSchema.parse(parsed.journalEntry);

                // 8. 重複検知ハッシュを生成
                if (validated) {
                    validated.duplicateCheckHash = this.generateSimpleHash(validated);
                }

                return {
                    fileType: parsed.fileType,
                    journalEntry: validated
                };

            } catch (error) {
                console.error(`試行 ${attempt}/${maxRetries} で失敗:`, error);

                if (attempt === maxRetries) {
                    // 最後の試行でも失敗した場合
                    throw new Error(
                        `Gemini API処理失敗（${maxRetries}回試行）: ${error instanceof Error ? error.message : String(error)}`
                    );
                }

                // 再試行前に少し待機（指数バックオフ）
                await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            }
        }

        throw new Error('予期しないエラー');
    }

    /**
     * 簡易ハッシュ生成（重複検知用）
     *
     * 注意: JournalSemanticGuard.generateDuplicateHash() と同等
     */
    private static generateSimpleHash(entry: JournalEntryDraft): string {
        return `${entry.date || 'NODATE'}_${entry.totalAmount || 0}_${entry.description || 'NODESC'}_${entry.clientCode}`;
    }
}
