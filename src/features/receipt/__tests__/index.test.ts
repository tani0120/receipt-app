import { describe, it, expect } from "vitest";
import {
    createDraftReceipt,
    submitReceipt,
    updateReceiptStatus,
} from "../index";
import { BusinessRuleError } from "../ReceiptSemanticGuard";
import { StateTransitionError } from "../receiptStateMachine";
import { ZodError } from "zod";

describe("Penta-Shield Pipeline - createDraftReceipt", () => {
    it("最小限のDraftを作成できる", () => {
        const input = {
            id: "00000000-0000-0000-0000-000000000001",
            status: "Draft",
        };

        const draft = createDraftReceipt(input);
        expect(draft.status).toBe("Draft");
    });

    it("不正な構造でZodError", () => {
        const invalid = {
            id: "invalid-uuid",
            status: "Draft",
        };

        expect(() => createDraftReceipt(invalid)).toThrow(ZodError);
    });
});

describe("Penta-Shield Pipeline - submitReceipt（関門）", () => {
    const validDraft = {
        id: "00000000-0000-0000-0000-000000000001",
        status: "Draft" as const,
        lines: [
            { accountCode: "600", amount: 1000, debitCredit: "debit" as const },
            { accountCode: "700", amount: 1000, debitCredit: "credit" as const },
        ],
        total: 2000,
        confidence: 0.95,
    };

    it("有効なDraftをSubmittedに変換できる", () => {
        const receipt = submitReceipt(validDraft);
        expect(receipt.status).toBe("Submitted");
    });

    it("L1: 不完全なDraftでZodError", () => {
        const incompleteDraft = {
            ...validDraft,
            lines: undefined, // 必須フィールド欠落
        };

        expect(() => submitReceipt(incompleteDraft)).toThrow(ZodError);
    });

    it("L2: 貸借不一致でBusinessRuleError", () => {
        const unbalancedDraft = {
            ...validDraft,
            lines: [
                { accountCode: "600", amount: 1000, debitCredit: "debit" as const },
                { accountCode: "700", amount: 500, debitCredit: "credit" as const }, // 不一致
            ],
        };

        expect(() => submitReceipt(unbalancedDraft)).toThrow(BusinessRuleError);
    });

    it("L2: 信頼度不足でBusinessRuleError", () => {
        const lowConfidenceDraft = {
            ...validDraft,
            confidence: 0.5, // < 0.8
        };

        expect(() => submitReceipt(lowConfidenceDraft)).toThrow(BusinessRuleError);
    });
});

describe("Penta-Shield Pipeline - updateReceiptStatus", () => {
    const submittedReceipt = {
        id: "00000000-0000-0000-0000-000000000001",
        status: "Submitted" as const,
        lines: [
            { accountCode: "600", amount: 1000, debitCredit: "debit" as const },
            { accountCode: "700", amount: 1000, debitCredit: "credit" as const },
        ],
        total: 2000,
        confidence: 0.95,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    it("Submitted → Approved は成功", () => {
        const approved = updateReceiptStatus(submittedReceipt, "Approved");
        expect(approved.status).toBe("Approved");
    });

    it("L3: Approved → Submitted は禁止", () => {
        const approvedReceipt = {
            ...submittedReceipt,
            status: "Approved" as const,
        };

        expect(() => updateReceiptStatus(approvedReceipt, "Submitted")).toThrow(
            StateTransitionError
        );
    });
});

describe("Penta-Shield Pipeline - 完全な流れ", () => {
    it("Draft → Submit → Approve の完全な流れ", () => {
        // 1. Draft作成
        const draft = createDraftReceipt({
            id: "00000000-0000-0000-0000-000000000001",
            status: "Draft",
            lines: [
                { accountCode: "600", amount: 1000, debitCredit: "debit" },
                { accountCode: "700", amount: 1000, debitCredit: "credit" },
            ],
            total: 2000,
            confidence: 0.95,
        });

        expect(draft.status).toBe("Draft");

        // 2. Submit（L1/L2/L3通過）
        const submitted = submitReceipt(draft);
        expect(submitted.status).toBe("Submitted");

        // 3. Approve（L3通過）
        const approved = updateReceiptStatus(submitted, "Approved");
        expect(approved.status).toBe("Approved");
    });
});
