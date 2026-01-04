
import { db } from '../lib/firebase';
import { geminiModel } from '../lib/gemini';
import { z } from 'zod';
import type { GenerateContentResult } from '@google/generative-ai';

// --- Types ---

export interface ConversionResult {
    lines: string[]; // CSV lines
    logId: string;
    summary: string;
}

// Log Schema for Firestore
const ConversionLogDbSchema = z.object({
    id: z.string(),
    clientId: z.string().optional(),
    fileName: z.string(),
    originalSize: z.number(),
    status: z.enum(['processing', 'completed', 'error']),
    timestamp: z.string(), // ISO
    downloadUrl: z.string().optional(),
    error: z.string().optional()
});

export class ConversionService {
    private static COLLECTION = 'conversion_logs';

    /**
     * Parse and Convert CSV using Gemini
     * @param fileContent Raw text content of the uploaded CSV
     * @param fileName Original filename
     */
    static async processCsv(fileContent: string, fileName: string): Promise<ConversionResult> {
        // 1. Create Initial Log
        const logId = db.collection(this.COLLECTION).doc().id;
        const initialLog = {
            id: logId,
            fileName,
            originalSize: fileContent.length,
            status: 'processing',
            timestamp: new Date().toISOString()
        };
        await db.collection(this.COLLECTION).doc(logId).set(initialLog);

        try {
            // 2. Call Gemini
            if (!geminiModel) throw new Error('Gemini Client not initialized');

            // Limit content for prototype (Token limits)
            // In production, we use Batch API or chunking
            const snippet = fileContent.substring(0, 30000);

            const prompt = `
            You are an expert Japanese Accountant AI.
            Your task is to convert the following raw CSV data (which might be from a bank, credit card, or Amazon) into "Yayoi Accounting Import Format" (Standard CSV).

            ### Input CSV (First 30k chars):
            ${snippet}

            ### Output Format Requirements:
            - A valid CSV with NO markdown code blocks.
            - Header row: "日付,借方勘定科目,借方金額,貸方勘定科目,貸方金額,摘要"
            - Date format: YYYY/MM/DD
            - Do NOT output anything other than the CSV data.
            - Infer the account titles (勘定科目) based on the description (摘要).
            - Default "借方" or "貸方" to "現金" or "普通預金" if unsure, but try to be specific.
            `;

            const result: GenerateContentResult = await geminiModel.generateContent(prompt);
            const responseText = result.response.text();

            // Clean up Markdown if Gemini adds it
            const csvContent = responseText.replace(/```csv/g, '').replace(/```/g, '').trim();

            // 3. Save Result (Mocking Storage by saving to Firestore specific field for now)
            // In real app, upload 'csvContent' to Cloud Storage and get URL.
            // For Pilot, we might just return it directly or store text.

            await db.collection(this.COLLECTION).doc(logId).update({
                status: 'completed',
                downloadUrl: 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent) // Mock Data URL
            });

            return {
                logId,
                lines: csvContent.split('\n'),
                summary: 'Conversion successful'
            };

        } catch (error: any) {
            await db.collection(this.COLLECTION).doc(logId).update({
                status: 'error',
                error: error.message
            });
            throw error;
        }
    }

    /**
     * List recent logs
     */
    static async listLogs() {
        const snapshot = await db.collection(this.COLLECTION)
            .orderBy('timestamp', 'desc')
            .limit(20)
            .get();

        return snapshot.docs.map(doc => doc.data());
    }

    /**
     * Delete log
     */
    static async deleteLog(id: string) {
        await db.collection(this.COLLECTION).doc(id).delete();
    }
}
