import type { Staff } from "./types";

// L2: Semantic Guard（業務意味防御）

export class BusinessRuleError extends Error {
    constructor(
        message: string,
        public readonly evidenceId: string = generateEvidenceId()
    ) {
        super(message);
        this.name = "BusinessRuleError";
    }
}

function generateEvidenceId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    return `EVT-${timestamp}-${random}`;
}

export class StaffSemanticGuard {
    static validate(staff: Staff): void {
        // 名前検証
        if (staff.name.trim().length === 0) {
            throw new BusinessRuleError("担当者名が空です");
        }

        // active=falseなのにApprovedの場合エラー
        if (!staff.active && staff.status === "Approved") {
            throw new BusinessRuleError(
                "無効な担当者は承認できません"
            );
        }

        // メールアドレス重複チェック（今回はスキップ）
    }
}
