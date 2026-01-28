import { z } from "zod";

// L1: Zod Guard（構造防御）

export const JobDraftSchema = z.object({
    id: z.string().uuid(),
    status: z.literal("Draft"),
    receiptId: z.string().optional(),
    date: z.date().optional(),
    accountCode: z.string().optional(),
    amount: z.number().optional(),
    debitCredit: z.enum(["debit", "credit"]).optional(),
    description: z.string().optional(),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
});

export const JobSchema = z.object({
    id: z.string().uuid(),
    status: z.enum(["Submitted", "Approved"]),
    receiptId: z.string().uuid(),
    date: z.date(),
    accountCode: z.string().min(1),
    amount: z.number(),
    debitCredit: z.enum(["debit", "credit"]),
    description: z.string(),
    createdAt: z.date(),
    updatedAt: z.date(),
});

export const JobKeys = JobSchema.keyof().enum;
export type JobKey = keyof typeof JobKeys;

export const JobDraftKeys = JobDraftSchema.keyof().enum;
export type JobDraftKey = keyof typeof JobDraftKeys;

export type JobInput = z.infer<typeof JobSchema>;
export type JobDraftInput = z.infer<typeof JobDraftSchema>;
