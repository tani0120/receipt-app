// Client Types
// すべての型定義を集約

export type ClientStatus = "Draft" | "Submitted" | "Approved";

export type Client = {
    id: string;
    status: "Submitted" | "Approved";
    name: string;              // 顧問先名
    contractDate: Date;        // 契約日
    担当者Id: string;          // 担当者
    active: boolean;           // 有効フラグ
    createdAt: Date;
    updatedAt: Date;
};

export type ClientDraft = {
    id: string;
    status: "Draft";
    name?: string;
    contractDate?: Date;
    担当者Id?: string;
    active?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
};
