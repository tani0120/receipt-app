import type { Job } from "./types";

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

export class JobSemanticGuard {
    static validate(job: Job): void {
        // 金額検証（0以下禁止）
        if (job.amount <= 0) {
            throw new BusinessRuleError(
                `金額が0以下です（${job.amount}）`
            );
        }

        // 勘定科目コード検証（最低限の形式チェック）
        if (job.accountCode.trim().length === 0) {
            throw new BusinessRuleError(
                "勘定科目コードが空です"
            );
        }

        // 仕訳日付検証（未来日付禁止）
        const now = new Date();
        if (job.date > now) {
            throw new BusinessRuleError(
                `仕訳日付が未来日付です（${job.date.toISOString()}）`
            );
        }
    }
}
