// Receipt Types
// すべての型定義を集約

export type ReceiptStatus = "Draft" | "Submitted" | "Approved";

export type ReceiptLine = {
    accountCode: string;
    amount: number;
    debitCredit: "debit" | "credit";
};

export type ReceiptDraft = {
    id: string;
    status: "Draft";
    lines?: ReceiptLine[];
    total?: number;
    confidence?: number;
    createdAt?: Date;
    updatedAt?: Date;
};

export type Receipt = {
    id: string;
    status: "Submitted" | "Approved";
    lines: ReceiptLine[];
    total: number;
    confidence: number;
    createdAt: Date;
    updatedAt: Date;
};
