import { describe, it, expect } from "vitest";
import {
  ReceiptSchema,
  ReceiptLineSchema,
} from "../ReceiptSchema";
import { ZodError } from "zod";

// L1: Zod Guard - 「存在可能なReceiptのみ」を扱う
// DraftはL1の対象外（UI層 or L0の責務）

describe("L1: Zod Guard - ReceiptLineSchema", () => {
  it("有効な明細行を受け入れる", () => {
    const validLine = {
      accountCode: "600",
      amount: 1000,
      debitCredit: "debit" as const,
    };

    expect(() => ReceiptLineSchema.parse(validLine)).not.toThrow();
  });

  it("必須フィールド欠落でエラー", () => {
    const invalid = {
      accountCode: "600",
      // amount欠落
    };

    expect(() => ReceiptLineSchema.parse(invalid)).toThrow(ZodError);
  });

  it("借方/貸方以外でエラー", () => {
    const invalid = {
      accountCode: "600",
      amount: 1000,
      debitCredit: "invalid",
    };

    expect(() => ReceiptLineSchema.parse(invalid)).toThrow(ZodError);
  });
});

describe("L1: Zod Guard - ReceiptSchema（確定Receiptのみ）", () => {
  const validReceipt = {
    id: "00000000-0000-0000-0000-000000000001",
    status: "Submitted",
    lines: [
      { accountCode: "600", amount: 1000, debitCredit: "debit" },
      { accountCode: "700", amount: 1000, debitCredit: "credit" },
    ],
    total: 2000, // 絶対値の合計
    confidence: 0.95,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it("有効なReceiptを受け入れる", () => {
    expect(() => ReceiptSchema.parse(validReceipt)).not.toThrow();
  });

  it("lines が空配列でエラー", () => {
    const invalid = {
      ...validReceipt,
      lines: [],
    };

    expect(() => ReceiptSchema.parse(invalid)).toThrow(ZodError);
  });

  it("confidence が範囲外でエラー", () => {
    const invalid = {
      ...validReceipt,
      confidence: 1.5, // > 1
    };

    expect(() => ReceiptSchema.parse(invalid)).toThrow(ZodError);
  });

  it("status が Draft でエラー（L1はDraftを扱わない）", () => {
    const invalid = {
      ...validReceipt,
      status: "Draft",
    };

    expect(() => ReceiptSchema.parse(invalid)).toThrow(ZodError);
  });

  it("必須フィールド欠落でエラー", () => {
    const invalid = {
      id: "00000000-0000-0000-0000-000000000001",
      status: "Submitted",
      // lines, total, confidence 欠落
    };

    expect(() => ReceiptSchema.parse(invalid)).toThrow(ZodError);
  });
});
