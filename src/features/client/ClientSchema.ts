import { z } from "zod";

// L1: Zod Guard（構造防御）
// ADR-005: 防御層実装詳細（L1/L2/L3）に準拠

// Draft段階（UI / OCR / モック用）
// optional許可 - 現実世界の入口を塞がない
export const ClientDraftSchema = z.object({
    id: z.string().uuid(),
    status: z.literal("Draft"),
    name: z.string().optional(),
    contractDate: z.date().optional(),
    担当者Id: z.string().optional(),
    active: z.boolean().optional(),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
});

// 確定Client（Submit以降）
// optional禁止 - L1/L2/L3を通過した完全なデータのみ
export const ClientSchema = z.object({
    id: z.string().uuid(),
    status: z.enum(["Submitted", "Approved"]),
    name: z.string().min(1),
    contractDate: z.date(),
    担当者Id: z.string().uuid(),
    active: z.boolean(),
    createdAt: z.date(),
    updatedAt: z.date(),
});

// Keys定義（ADR-001: 型安全マッピング戦略に準拠）
export const ClientKeys = ClientSchema.keyof().enum;
export type ClientKey = keyof typeof ClientKeys;

export const ClientDraftKeys = ClientDraftSchema.keyof().enum;
export type ClientDraftKey = keyof typeof ClientDraftKeys;

// 型推論
export type ClientInput = z.infer<typeof ClientSchema>;
export type ClientDraftInput = z.infer<typeof ClientDraftSchema>;
