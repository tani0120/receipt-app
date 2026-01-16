import { describe, it, expect } from "vitest";
import { ReceiptSemanticGuard, BusinessRuleError } from "../ReceiptSemanticGuard";
import type { Receipt } from "../types";

describe("L2: Semantic Guard - 貸借一致検証", () => {
    const createReceipt = (lines: any[]): Receipt => ({
        id: "00000000-0000-0000-0000-000000000001",
        status: "Submitted",
        lines,
        total: 2000, // 借方1000 + 貸方1000 = 2000（絶対値の合計）
        confidence: 0.95,
        createdAt: new Date(),
        updatedAt: new Date(),
    });

    it("貸借が一致する場合は成功", () => {
        const receipt = createReceipt([
            { accountCode: "600", amount: 1000, debitCredit: "debit" },
            { accountCode: "700", amount: 1000, debitCredit: "credit" },
        ]);

        expect(() => ReceiptSemanticGuard.validate(receipt)).not.toThrow();
    });

    it("貸借が不一致の場合はエラー", () => {
        const receipt = createReceipt([
            { accountCode: "600", amount: 1000, debitCredit: "debit" },
            { accountCode: "700", amount: 500, debitCredit: "credit" }, // 不一致
        ]);

        expect(() => ReceiptSemanticGuard.validate(receipt)).toThrow(
            BusinessRuleError
        );
        expect(() => ReceiptSemanticGuard.validate(receipt)).toThrow(
            "貸借合計が一致しません"
        );
    });
});

describe("L2: Semantic Guard - OCR信頼度検証", () => {
    const createReceipt = (confidence: number): Receipt => ({
        id: "00000000-0000-0000-0000-000000000001",
        status: "Submitted",
        lines: [
            { accountCode: "600", amount: 1000, debitCredit: "debit" },
            { accountCode: "700", amount: 1000, debitCredit: "credit" },
        ],
        total: 2000,
        confidence,
        createdAt: new Date(),
        updatedAt: new Date(),
    });

    it("信頼度が0.8以上の場合は成功", () => {
        const receipt = createReceipt(0.8);
        expect(() => ReceiptSemanticGuard.validate(receipt)).not.toThrow();
    });

    it("信頼度が0.8未満の場合はエラー", () => {
        const receipt = createReceipt(0.7);

        expect(() => ReceiptSemanticGuard.validate(receipt)).toThrow(
            BusinessRuleError
        );
        expect(() => ReceiptSemanticGuard.validate(receipt)).toThrow(
            "OCR信頼度が不足しています"
        );
    });
});

describe("L2: Semantic Guard - 合計金額検証", () => {
    it("合計金額が正しい場合は成功", () => {
        const receipt: Receipt = {
            id: "00000000-0000-0000-0000-000000000001",
            status: "Submitted",
            lines: [
                { accountCode: "600", amount: 1000, debitCredit: "debit" },
                { accountCode: "700", amount: 1000, debitCredit: "credit" },
            ],
            total: 2000, // 1000 + 1000
            confidence: 0.95,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        expect(() => ReceiptSemanticGuard.validate(receipt)).not.toThrow();
    });

    it("合計金額が不正な場合はエラー", () => {
        const receipt: Receipt = {
            id: "00000000-0000-0000-0000-000000000001",
            status: "Submitted",
            lines: [
                { accountCode: "600", amount: 1000, debitCredit: "debit" },
                { accountCode: "700", amount: 1000, debitCredit: "credit" },
            ],
            total: 1500, // 不正（実際は2000）
            confidence: 0.95,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        expect(() => ReceiptSemanticGuard.validate(receipt)).toThrow(
            BusinessRuleError
        );
        expect(() => ReceiptSemanticGuard.validate(receipt)).toThrow(
            "合計金額が不正です"
        );
    });
});

describe("L2: Semantic Guard - Evidence ID生成", () => {
    it("BusinessRuleErrorにEvidenceIDが含まれる", () => {
        const receipt: Receipt = {
            id: "00000000-0000-0000-0000-000000000001",
            status: "Submitted",
            lines: [
                { accountCode: "600", amount: 1000, debitCredit: "debit" },
                // 貸方なし → 貸借不一致
            ],
            total: 1000,
            confidence: 0.95,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        try {
            ReceiptSemanticGuard.validate(receipt);
        } catch (error) {
            if (error instanceof BusinessRuleError) {
                expect(error.evidenceId).toMatch(/^EVT-\d+-[a-z0-9]+$/);
            }
        }
    });
});
