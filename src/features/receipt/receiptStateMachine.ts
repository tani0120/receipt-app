import type { ReceiptStatus } from "./types";

// L3: State Guard（状態遷移防御）
// ADR-005: 防御層実装詳細（L1/L2/L3）に準拠

// 状態遷移エラー
export class StateTransitionError extends Error {
    constructor(
        public readonly from: ReceiptStatus,
        public readonly to: ReceiptStatus,
        public readonly evidenceId: string = generateEvidenceId()
    ) {
        super(`禁止遷移: ${from} → ${to}`);
        this.name = "StateTransitionError";
    }
}

// Evidence ID生成（L2と同一）
function generateEvidenceId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    return `EVT-${timestamp}-${random}`;
}

// 許可遷移定義
const ALLOWED_TRANSITIONS: Record<ReceiptStatus, ReceiptStatus[]> = {
    Draft: ["Submitted"],
    Submitted: ["Approved"],
    Approved: [], // 終端状態
};

/**
 * L3: 状態遷移検証
 *
 * 許可遷移:
 * - Draft → Submitted
 * - Submitted → Approved
 *
 * 禁止遷移:
 * - Approved → Submitted（巻き戻し禁止）
 * - Approved → Draft（巻き戻し禁止）
 * - その他すべて
 */
export function assertReceiptTransition(
    from: ReceiptStatus,
    to: ReceiptStatus
): void {
    const allowed = ALLOWED_TRANSITIONS[from] || [];

    if (!allowed.includes(to)) {
        throw new StateTransitionError(from, to);
    }
}

/**
 * XState風の状態マシン定義（オプション）
 * 実際の実装ではassertReceiptTransitionを使用
 */
export const receiptStateMachine = {
    id: "receipt",
    initial: "Draft" as const,
    states: {
        Draft: {
            on: { SUBMIT: "Submitted" as const },
        },
        Submitted: {
            on: { APPROVE: "Approved" as const },
        },
        Approved: {
            type: "final" as const,
        },
    },
} as const;

export type ReceiptEvent =
    | { type: "SUBMIT" }
    | { type: "APPROVE" };
