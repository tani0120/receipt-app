import { describe, it, expect } from "vitest";
import {
    assertReceiptTransition,
    StateTransitionError,
} from "../receiptStateMachine";
import type { ReceiptStatus } from "../types";

describe("L3: State Guard - 許可遷移", () => {
    it("Draft → Submitted は許可", () => {
        expect(() => assertReceiptTransition("Draft", "Submitted")).not.toThrow();
    });

    it("Submitted → Approved は許可", () => {
        expect(() => assertReceiptTransition("Submitted", "Approved")).not.toThrow();
    });
});

describe("L3: State Guard - 禁止遷移", () => {
    it("Approved → Submitted は禁止（巻き戻し）", () => {
        expect(() => assertReceiptTransition("Approved", "Submitted")).toThrow(
            StateTransitionError
        );
    });

    it("Approved → Draft は禁止（巻き戻し）", () => {
        expect(() => assertReceiptTransition("Approved", "Draft")).toThrow(
            StateTransitionError
        );
    });

    it("Submitted → Draft は禁止（巻き戻し）", () => {
        expect(() => assertReceiptTransition("Submitted", "Draft")).toThrow(
            StateTransitionError
        );
    });

    it("Draft → Approved は禁止（段階スキップ）", () => {
        expect(() => assertReceiptTransition("Draft", "Approved")).toThrow(
            StateTransitionError
        );
    });

    it("Approved → Approved は禁止（同一状態）", () => {
        expect(() => assertReceiptTransition("Approved", "Approved")).toThrow(
            StateTransitionError
        );
    });
});

describe("L3: State Guard - StateTransitionError", () => {
    it("エラーメッセージに遷移元・遷移先が含まれる", () => {
        try {
            assertReceiptTransition("Approved", "Submitted");
        } catch (error) {
            if (error instanceof StateTransitionError) {
                expect(error.message).toContain("Approved");
                expect(error.message).toContain("Submitted");
                expect(error.from).toBe("Approved");
                expect(error.to).toBe("Submitted");
            }
        }
    });

    it("Evidence IDが生成される", () => {
        try {
            assertReceiptTransition("Approved", "Submitted");
        } catch (error) {
            if (error instanceof StateTransitionError) {
                expect(error.evidenceId).toMatch(/^EVT-\d+-[a-z0-9]+$/);
            }
        }
    });
});
