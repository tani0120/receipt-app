// Penta-Shield: Staff L1-L3パイプライン

import { StaffSchema, StaffDraftSchema } from "./StaffSchema";
import { StaffSemanticGuard } from "./StaffSemanticGuard";
import { assertStaffTransition } from "./staffStateMachine";
import type { Staff, StaffDraft, StaffStatus } from "./types";

export * from "./types";
export * from "./StaffSchema";
export * from "./StaffSemanticGuard";
export * from "./staffStateMachine";

export function createDraftStaff(input: unknown): StaffDraft {
    return StaffDraftSchema.parse(input);
}

export function submitStaff(draft: StaffDraft): Staff {
    const submittedData = {
        ...draft,
        status: "Submitted" as const,
        createdAt: draft.createdAt || new Date(),
        updatedAt: new Date(),
    };

    const parsed = StaffSchema.parse(submittedData);
    StaffSemanticGuard.validate(parsed);
    return parsed;
}

export function updateStaffStatus(
    staff: Staff,
    newStatus: StaffStatus
): Staff {
    assertStaffTransition(staff.status, newStatus);
    const updated: Staff = {
        ...staff,
        status: newStatus as "Submitted" | "Approved",
        updatedAt: new Date(),
    };
    StaffSemanticGuard.validate(updated);
    return updated;
}

export function getStaff(id: string): Staff | null {
    return null;
}
