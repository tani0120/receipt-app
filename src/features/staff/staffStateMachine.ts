import type { StaffStatus } from "./types";

// L3: State Guard（状態遷移防御）

export class StateTransitionError extends Error {
    constructor(
        public readonly from: StaffStatus,
        public readonly to: StaffStatus,
        public readonly evidenceId: string = generateEvidenceId()
    ) {
        super(`禁止遷移: ${from} → ${to}`);
        this.name = "StateTransitionError";
    }
}

function generateEvidenceId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    return `EVT-${timestamp}-${random}`;
}

const ALLOWED_TRANSITIONS: Record<StaffStatus, StaffStatus[]> = {
    Draft: ["Submitted"],
    Submitted: ["Approved"],
    Approved: [],
};

export function assertStaffTransition(
    from: StaffStatus,
    to: StaffStatus
): void {
    const allowed = ALLOWED_TRANSITIONS[from] || [];
    if (!allowed.includes(to)) {
        throw new StateTransitionError(from, to);
    }
}

export const staffStateMachine = {
    id: "staff",
    initial: "Draft" as const,
    states: {
        Draft: { on: { SUBMIT: "Submitted" as const } },
        Submitted: { on: { APPROVE: "Approved" as const } },
        Approved: { type: "final" as const },
    },
} as const;

export type StaffEvent = { type: "SUBMIT" } | { type: "APPROVE" };
