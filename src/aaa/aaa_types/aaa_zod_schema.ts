import { z } from 'zod';
import { Timestamp } from 'firebase/firestore';

// ============================================================================
// 0. Base Schemas & Enums
// ============================================================================

// Timestamp Validator: Checks for Firestore Timestamp instance or compatible object structure
export const TimestampSchema = z.custom<Timestamp>((data) => {
  if (data instanceof Timestamp) return true;
  // Loose object check for serialization (seconds, nanoseconds)
  return (
    typeof data === 'object' &&
    data !== null &&
    'seconds' in data &&
    typeof (data as any).seconds === 'number' &&
    'nanoseconds' in data &&
    typeof (data as any).nanoseconds === 'number'
  );
}, { message: "Invalid Firestore Timestamp" });

export const TaxFilingTypeSchema = z.enum(['blue', 'white']);
export const ConsumptionTaxModeSchema = z.enum(['general', 'simplified', 'exempt']);
export const SimplifiedTaxCategorySchema = z.union([
  z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5), z.literal(6)
]);

export const JobStatusSchema = z.enum([
  'pending', 'ai_processing', 'ready_for_work', 'primary_completed', 'review',
  'waiting_approval', 'remanded', 'approved', 'generating_csv', 'done', 'error_retry', 'excluded'
]);

export const JobPrioritySchema = z.enum(['high', 'normal', 'low']);

export const TaxTypeSchema = z.enum(['taxable', 'non_taxable', 'exempt', 'out_of_scope', 'reverse_charge']);

export const InvoiceIssuerTypeSchema = z.enum(['qualified', 'transitional_80', 'transitional_50', 'non_qualified', 'unknown']);

export const AccountingSoftwareSchema = z.enum(['yayoi', 'freee', 'mf', 'other']);

export const TaxCalculationMethodSchema = z.enum(['stack', 'back']);
export const RoundingSettingsSchema = z.enum(['floor', 'round', 'ceil']);

// ============================================================================
// 1. Client Schema
// ============================================================================
export const ClientSchema = z.object({
  clientCode: z.string(),
  companyName: z.string(),
  type: z.enum(['corp', 'individual']).optional(), // Added type
  repName: z.string().optional(),
  staffName: z.string().optional(), // Added staffName
  contactInfo: z.string().optional(),
  fiscalMonth: z.number().int().min(1).max(12),
  status: z.enum(['active', 'inactive', 'suspension']),

  // Folder Rules
  sharedFolderId: z.string(),
  processingFolderId: z.string(),
  archivedFolderId: z.string(),
  excludedFolderId: z.string(),
  csvOutputFolderId: z.string(),
  learningCsvFolderId: z.string(),

  // Tax Settings
  taxFilingType: TaxFilingTypeSchema,
  consumptionTaxMode: ConsumptionTaxModeSchema,
  simplifiedTaxCategory: SimplifiedTaxCategorySchema.optional(),
  defaultTaxRate: z.number().optional(),
  taxMethod: z.enum(['inclusive', 'exclusive']).optional(),

  // New Fields
  taxCalculationMethod: TaxCalculationMethodSchema.optional(),
  isInvoiceRegistered: z.boolean().optional(),
  roundingSettings: RoundingSettingsSchema.optional(),
  invoiceRegistrationNumber: z.string().optional(), // For storing T-Number if needed

  accountingSoftware: AccountingSoftwareSchema,
  aiKnowledgePrompt: z.string().optional(),
  defaultPaymentMethod: z.enum(['cash', 'credit_card', 'bank_transfer']).optional(),
  calculationMethod: z.enum(['accrual', 'cash', 'interim_cash']).optional(),

  driveLinked: z.boolean(),
  updatedAt: TimestampSchema
});

// ============================================================================
// 2. Job & Journal Schema
// ============================================================================

export const JournalLineSchema = z.object({
  lineNo: z.number(),

  // Debit
  drAccount: z.string(),
  drSubAccount: z.string().optional(),
  drAmount: z.number(),
  drTaxClass: z.string().optional(),
  drTaxAmount: z.number().optional(),

  // Credit
  crAccount: z.string(),
  crSubAccount: z.string().optional(),
  crAmount: z.number(),
  crTaxClass: z.string().optional(),
  crTaxAmount: z.number().optional(),

  // Meta
  description: z.string(),
  departmentCode: z.string().optional(),
  note: z.string().optional(),

  invoiceIssuer: InvoiceIssuerTypeSchema.optional(),

  taxDetails: z.object({
    rate: z.union([z.literal(10), z.literal(8), z.literal(0)]),
    type: TaxTypeSchema,
    isReducedRate: z.boolean()
  }).optional(),

  isAutoMaster: z.boolean().optional(),
  flags: z.object({
    isTenThousandYen: z.boolean().optional(),
    isSocialExpense: z.boolean().optional(),
    isTaxDiff: z.boolean().optional()
  }).optional()
});

export const JobSchema = z.object({
  id: z.string(),
  clientCode: z.string(),
  driveFileId: z.string(),
  driveFileUrl: z.string().optional(),
  status: JobStatusSchema,
  priority: JobPrioritySchema,
  retryCount: z.number(),

  transactionDate: TimestampSchema,
  createdAt: TimestampSchema,
  startedAt: TimestampSchema.optional(),
  finishedAt: TimestampSchema.optional(),
  updatedAt: TimestampSchema,

  lockedByUserId: z.string().optional(),
  lockedAt: TimestampSchema.optional(),

  confidenceScore: z.number(),
  aiAnalysisRaw: z.string().optional(),

  aiUsageStats: z.object({
    inputTokens: z.number(),
    outputTokens: z.number(),
    estimatedCostUsd: z.number(),
    modelName: z.string()
  }).optional(),

  invoiceValidationLog: z.object({
    registrationNumber: z.string().optional(),
    isValid: z.boolean(),
    apiResponse: z.any().optional(), // Raw response can be any
    checkedAt: TimestampSchema
  }).optional(),

  currentPhase: z.number().optional(),
  errorMessage: z.string().optional(),

  lines: z.array(JournalLineSchema),

  detectionAlerts: z.array(z.object({
    code: z.string(),
    message: z.string(),
    severity: z.enum(['info', 'warning', 'critical'])
  })).optional(),

  reviewStatus: z.enum(['confirmed', 'unknown', 'exclude_candidate']).optional()
});

// ============================================================================
// 3. Learning Rules
// ============================================================================
export const LearningRuleSchema = z.object({
  id: z.string(),
  clientCode: z.string(),
  keyword: z.string(),
  targetField: z.enum(['description', 'vendor', 'amount_range']),
  accountItem: z.string(),
  subAccount: z.string().optional(),
  taxClass: z.string().optional(),
  confidenceScore: z.number(),
  hitCount: z.number(),
  lastAppliedJobId: z.string().optional(),
  isActive: z.boolean(),
  updatedAt: TimestampSchema
});

// ============================================================================
// 4. Audit Log
// ============================================================================
export const AuditLogSchema = z.object({
  id: z.string(),
  logTimestamp: TimestampSchema,
  userId: z.string(),
  userEmail: z.string().optional(),
  action: z.enum(['APPROVE', 'REJECT', 'MODIFY', 'LOGIN', 'EMERGENCY_STOP', 'CONFIG_CHANGE']),
  screenId: z.string().optional(),
  logicId: z.string().optional(),
  targetCollection: z.enum(['jobs', 'clients', 'system_settings']),
  targetId: z.string().optional(),
  previousData: z.any().optional(),
  newData: z.any().optional()
});

// ============================================================================
// 5. System Settings
// ============================================================================
export const SystemSettingsSchema = z.object({
  systemStatus: z.enum(['ACTIVE', 'PAUSE', 'EMERGENCY_STOP']),
  aiModelName: z.string(),
  geminiApiKey: z.string().optional(),
  invoiceSystemApiKey: z.string().optional(),
  apiUnitCostIn: z.number(),
  apiUnitCostOut: z.number(),
  usdJpyRate: z.number(),
  maxRetries: z.number(),
  dataRetentionDays: z.number(),
  updatedAt: TimestampSchema
});
