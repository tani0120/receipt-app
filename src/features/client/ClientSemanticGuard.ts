import type { Client } from "./types";

// L2: Semantic Guard（業務意味防御）
// ADR-005: 防御層実装詳細（L1/L2/L3）に準拠

// 業務ルールエラー
export class BusinessRuleError extends Error {
    constructor(
        message: string,
        public readonly evidenceId: string = generateEvidenceId()
    ) {
        super(message);
        this.name = "BusinessRuleError";
    }
}

// Evidence ID生成（簡易実装）
function generateEvidenceId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    return `EVT-${timestamp}-${random}`;
}

// Semantic Guard本体
export class ClientSemanticGuard {
    /**
     * L2: 業務ルール検証
     * Zodとは完全分離 - 意味的な整合性のみを扱う
     */
    static validate(client: Client): void {
        // 契約日検証（未来日付禁止）
        const now = new Date();
        if (client.contractDate > now) {
            throw new BusinessRuleError(
                `契約日が未来日付です（${client.contractDate.toISOString()}）`
            );
        }

        // active=falseなのに状態がApprovedの場合エラー
        if (!client.active && client.status === "Approved") {
            throw new BusinessRuleError(
                "無効な顧問先は承認できません"
            );
        }

        // 名前の妥当性チェック
        if (client.name.trim().length === 0) {
            throw new BusinessRuleError(
                "顧問先名が空です"
            );
        }
    }
}
