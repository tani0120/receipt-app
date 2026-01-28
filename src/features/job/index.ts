// Penta-Shield: Job L1-L3パイプライン

import { JobSchema, JobDraftSchema } from "./JobSchema";
import { JobSemanticGuard } from "./JobSemanticGuard";
import { assertJobTransition } from "./jobStateMachine";
import type { Job, JobDraft, JobStatus } from "./types";

export * from "./types";
export * from "./JobSchema";
export * from "./JobSemanticGuard";
export * from "./jobStateMachine";

export function createDraftJob(input: unknown): JobDraft {
    return JobDraftSchema.parse(input);
}

export function submitJob(draft: JobDraft): Job {
    const submittedData = {
        ...draft,
        status: "Submitted" as const,
        createdAt: draft.createdAt || new Date(),
        updatedAt: new Date(),
    };

    const parsed = JobSchema.parse(submittedData);
    JobSemanticGuard.validate(parsed);
    return parsed;
}

export function updateJobStatus(
    job: Job,
    newStatus: JobStatus
): Job {
    assertJobTransition(job.status, newStatus);
    const updated: Job = {
        ...job,
        status: newStatus as "Submitted" | "Approved",
        updatedAt: new Date(),
    };
    JobSemanticGuard.validate(updated);
    return updated;
}

export function getJob(id: string): Job | null {
    return null;
}
