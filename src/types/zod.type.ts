import { z } from 'zod';
import {
  ClientSchema,
  JobSchema,
  JournalLineSchema,
  LearningRuleSchema,
  AuditLogSchema,
  SystemSettingsSchema
} from './zod_schema';

// ============================================================================
// Inferred Types (API Layer)
// These types reflect the RAW data from DB, including Optionals and Nulls.
// DO NOT use these in UI Key Components directly. Use Mapped UI types instead.
// ============================================================================

export type ClientApi = z.infer<typeof ClientSchema>;
export type JobApi = z.infer<typeof JobSchema>;
export type JournalLineApi = z.infer<typeof JournalLineSchema>;
export type LearningRuleApi = z.infer<typeof LearningRuleSchema>;
export type AuditLogApi = z.infer<typeof AuditLogSchema>;
export type SystemSettingsApi = z.infer<typeof SystemSettingsSchema>;
