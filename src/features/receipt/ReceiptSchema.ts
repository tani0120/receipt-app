import { z } from "zod";

// L1: Zod Guard（構造防御）
// ADR-005: 防御層実装詳細（L1/L2/L3）に準拠

// 明細行スキーマ
export const ReceiptLineSchema = z.object({
  accountCode: z.string().min(1),
  amount: z.number().int(),
  debitCredit: z.enum(["debit", "credit"]), // errorMapは後工程で追加
});

// Draft段階（UI / OCR / モック用）
// optional許可 - 現実世界の入口を塞がない
export const ReceiptDraftSchema = z.object({
  id: z.string().uuid(),
  status: z.literal("Draft"),
  lines: z.array(ReceiptLineSchema).optional(),
  total: z.number().optional(),
  confidence: z.number().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// 確定Receipt（Submit以降）
// optional禁止 - L1/L2/L3を通過した完全なデータのみ
export const ReceiptSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["Submitted", "Approved"]), // errorMapは後工程で追加
  lines: z.array(ReceiptLineSchema).min(1),
  total: z.number(),
  confidence: z.number().min(0).max(1),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Keys定義（ADR-001: 型安全マッピング戦略に準拠）
export const ReceiptKeys = ReceiptSchema.keyof().enum;
export type ReceiptKey = keyof typeof ReceiptKeys;

export const ReceiptDraftKeys = ReceiptDraftSchema.keyof().enum;
export type ReceiptDraftKey = keyof typeof ReceiptDraftKeys;

// 型推論
export type ReceiptInput = z.infer<typeof ReceiptSchema>;
export type ReceiptDraftInput = z.infer<typeof ReceiptDraftSchema>;
export type ReceiptLineInput = z.infer<typeof ReceiptLineSchema>;
