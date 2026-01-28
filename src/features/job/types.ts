// Job Types (仕訳)

export type JobStatus = "Draft" | "Submitted" | "Approved";

export type Job = {
    id: string;
    status: "Submitted" | "Approved";
    receiptId: string;         // 領収書ID
    date: Date;                // 仕訳日付
    accountCode: string;       // 勘定科目コード
    amount: number;            // 金額
    debitCredit: "debit" | "credit";  // 借方/貸方
    description: string;       // 摘要
    createdAt: Date;
    updatedAt: Date;
};

export type JobDraft = {
    id: string;
    status: "Draft";
    receiptId?: string;
    date?: Date;
    accountCode?: string;
    amount?: number;
    debitCredit?: "debit" | "credit";
    description?: string;
    createdAt?: Date;
    updatedAt?: Date;
};
