import { z } from "zod";

// L1: Zod Guard（構造防御）

export const StaffDraftSchema = z.object({
    id: z.string().uuid(),
    status: z.literal("Draft"),
    name: z.string().optional(),
    email: z.string().optional(),
    role: z.enum(["admin", "staff"]).optional(),
    active: z.boolean().optional(),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
});

export const StaffSchema = z.object({
    id: z.string().uuid(),
    status: z.enum(["Submitted", "Approved"]),
    name: z.string().min(1),
    email: z.string().email(),
    role: z.enum(["admin", "staff"]),
    active: z.boolean(),
    createdAt: z.date(),
    updatedAt: z.date(),
});

export const StaffKeys = StaffSchema.keyof().enum;
export type StaffKey = keyof typeof StaffKeys;

export const StaffDraftKeys = StaffDraftSchema.keyof().enum;
export type StaffDraftKey = keyof typeof StaffDraftKeys;

export type StaffInput = z.infer<typeof StaffSchema>;
export type StaffDraftInput = z.infer<typeof StaffDraftSchema>;
