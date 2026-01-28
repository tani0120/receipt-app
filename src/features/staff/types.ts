// Staff Types (担当者)

export type StaffStatus = "Draft" | "Submitted" | "Approved";

export type Staff = {
    id: string;
    status: "Submitted" | "Approved";
    name: string;              // 担当者名
    email: string;             // メールアドレス
    role: "admin" | "staff";   // 役割
    active: boolean;           // 有効フラグ
    createdAt: Date;
    updatedAt: Date;
};

export type StaffDraft = {
    id: string;
    status: "Draft";
    name?: string;
    email?: string;
    role?: "admin" | "staff";
    active?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
};
