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
    typeof (data as Record<string, unknown>).seconds === 'number' &&
    'nanoseconds' in data &&
    typeof (data as Record<string, unknown>).nanoseconds === 'number'
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
  contact: z.object({
    type: z.enum(['email', 'chatwork', 'none']).optional(),
    value: z.string().optional()
  }).optional(),
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
  updatedAt: TimestampSchema,

  // Phase 4-1: Medium-frequency client properties (30-49 occurrences)
  isNew: z.boolean().optional(),
  filingCount: z.number().optional()
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

  reviewStatus: z.enum(['confirmed', 'unknown', 'exclude_candidate']).optional(),

  // Phase 4-1: High-frequency properties (50+ occurrences)
  name: z.string().optional(),
  path: z.string().optional(), // File path or route path
  title: z.string().optional(),
  imageTitle: z.string().optional(),
  debits: z.array(z.any()).optional(), // Array structure TBD
  credits: z.array(z.any()).optional(), // Array structure TBD
  amount: z.number().optional(),
  proposal: z.string().optional(),
  aiInference: z.string().optional(),
  history: z.string().optional(),

  // Phase 4-1: Medium-frequency properties (30-49 occurrences)
  export: z.string().optional(),
  archive: z.string().optional(),
  receipt: z.string().optional(),
  steps: z.string().optional(),
  clientName: z.string().optional(),
  aiAnalysis: z.string().optional(),
  isResolved: z.boolean().optional(),
  category: z.string().optional(),
  remand: z.string().optional(),
  nextAction: z.string().optional(),
  journalEntry: z.string().optional(),
  approval: z.string().optional(),
  result: z.string().optional(),
  trigger: z.string().optional(),
  jobId: z.string().optional(), // Cross-reference or temporary ID
  exportCount: z.number().optional(),
  missingCount: z.number().optional(),

  // Phase 4-2: Medium-low frequency properties (20-29 occurrences)
  default: z.string().optional(),
  settings: z.string().optional(), // Generic settings object
  learningCount: z.number().optional(),
  hasDuplicate: z.boolean().optional(),
  alertCount: z.number().optional(),
  draftCount: z.number().optional(),
  approvalCount: z.number().optional(),
  mode: z.string().optional(),
  reconcileCount: z.number().optional(),
  reason: z.string().optional(),
  totalAmount: z.number().optional(),
  label: z.string().optional(),
  summary: z.string().optional(),
  isExcluded: z.boolean().optional(),
  vendor: z.string().optional(),
  fiscalMonthLabel: z.string().optional(),
  confidence: z.string().optional(), // May overlap with confidenceScore
  monthlyJournals: z.string().optional(),
  credit: z.string().optional(),
  display: z.string().optional(), // UI control or business flag - TBD
  fileName: z.string().optional(),
  debit: z.string().optional(),
  softwareLabel: z.string().optional(),
  sourceSoftware: z.string().optional(),
  driveLinks: z.string().optional(),

  // Phase 4-3: Low-frequency properties (10-19 occurrences)
  date: z.date().optional(),
  targetSoftware: z.string().optional(),
  downloadUrl: z.string().optional(),
  isDownloaded: z.boolean().optional(),
  contactInfo: z.string().optional(),
  backlogs: z.string().optional(),
  bankName: z.string().optional(),
  velocity: z.string().optional(),
  value: z.string().optional(),
  primaryAction: z.string().optional(),
  phase: z.string().optional(),
  phaseName: z.string().optional(),
  keywords: z.string().optional(),
  originalFolderId: z.string().optional(),
  performance: z.string().optional(),
  funnel: z.string().optional(),
  icon: z.string().optional(),
  autoConversionRate: z.number().optional(),
  masterSearch: z.string().optional(),
  aiAccuracy: z.string().optional(),
  clientId: z.string().optional(),
  balanceDiff: z.string().optional(),
  pastJournals: z.string().optional(),
  layoutType: z.string().optional(),
  monthlyTrend: z.string().optional(),
  journalExclusion: z.string().optional(),
  rep: z.string().optional(),
  month: z.number().optional(),
  journalOutput: z.string().optional(),
  storage: z.string().optional(),
  banks: z.string().optional(),
  query: z.string().optional(),
  creditCards: z.string().optional(),
  kpi: z.string().optional(),
  actions: z.string().optional(),
  staff: z.string().optional(),
  received: z.string().optional(),
  taxRate: z.number().optional(),
  provider: z.string().optional(),
  exported: z.string().optional(),
  visible: z.string().optional(), // UI control or business flag - TBD
  errors: z.string().optional(),

  // Phase 4-4: Single-digit properties - Batch 1/40 (9 occurrences)
  tax: z.string().optional(),
  selected: z.string().optional(), // Used in v-model
  decision: z.string().optional(),
  show: z.string().optional(),
  subtitle: z.string().optional(),
  ai_reason: z.string().optional(),
  calcMethod: z.string().optional(),
  actionStatus: z.string().optional(),
  acct: z.string().optional(),
  style: z.string().optional(),

  // Phase 4-4: Single-digit properties - Batch 2-11 (100 properties, 8 occ and below)
  content: z.string().optional(),
  capabilities: z.string().optional(),
  generatedBy: z.string().optional(),
  evidenceId: z.string().optional(),
  data: z.string().optional(),
  remandCount: z.number().optional(),
  invoiceApiKey: z.string().optional(),
  set: z.string().optional(),
  source: z.string().optional(),
  closingBalance: z.string().optional(),
  未処理: z.string().optional(), // ⚠️ Japanese property name
  year: z.number().optional(),
  crSub: z.string().optional(),
  historyBalances: z.string().optional(),
  last4Digits: z.string().optional(),
  drSub: z.string().optional(),
  size: z.number().optional(),
  debitAccount: z.number().optional(),
  isIndividual: z.boolean().optional(),
  state: z.string().optional(),
  showButton: z.string().optional(),
  invoiceLog: z.string().optional(),
  accountName: z.string().optional(),
  表示件数: z.string().optional(), // ⚠️ Japanese property name
  accountId: z.string().optional(),
  get: z.string().optional(),
  sub: z.string().optional(),
  matchedKeywords: z.string().optional(),
  accountNumber: z.number().optional(),
  gap: z.string().optional(),
  invoiceIssuer: z.string().optional(),
  projectId: z.string().optional(),
  processingTime: z.string().optional(),
  calcMethodShortLabel: z.string().optional(),
  taxInfoLabel: z.string().optional(),
  iconColorClass: z.string().optional(),
  checkedAt: z.date().optional(),
  isEnabled: z.boolean().optional(),
  velocityPerHour: z.string().optional(),
  tags: z.string().optional(),
  learning: z.string().optional(),
  targetSoftwareLabel: z.string().optional(),
  lastYearSameMonth: z.number().optional(),
  simplifiedTaxCategoryLabel: z.string().optional(),
  typeLabel: z.string().optional(),
  thisYear: z.number().optional(),
  lastYear: z.number().optional(),
  roundingSettingsLabel: z.string().optional(),
  taxCalculationMethodLabel: z.string().optional(),
  invoiceRegistrationLabel: z.string().optional(),
  evidenceUrl: z.string().optional(),
  apiCostThisYear: z.number().optional(),
  velocityThisMonth: z.number().optional(),
  account: z.number().optional(),
  journalsThisMonth: z.number().optional(),
  stoppedClients: z.string().optional(),
  fileSize: z.number().optional(),
  registeredClients: z.string().optional(),
  activeClients: z.string().optional(),
  timePer100Journals: z.string().optional(),
  lastUsedAt: z.date().optional(),
  monthlyAvg: z.string().optional(),
  lastMonth: z.number().optional(),
  metadata: z.string().optional(),
  staffCount: z.number().optional(),
  draft: z.string().optional(),
  count: z.number().optional(),
  maxRetries: z.string().optional(),
  details: z.string().optional(),
  ai: z.string().optional(),
  logTimestamp: z.date().optional(),
  sourceSoftwareLabel: z.string().optional(),
  form: z.string().optional(),
  isDownloadable: z.boolean().optional(),
  establishmentDate: z.date().optional(),
  colors: z.string().optional(),
  text: z.string().optional(),
  sourceType: z.string().optional(),
  statusLabel: z.string().optional(),
  cardHolder: z.string().optional(),
  param: z.string().optional(),
  fingerprints: z.string().optional(),
  dateLabel: z.string().optional(),
  detectedStartBalance: z.string().optional(),
  primaryColors: z.string().optional(),
  items: z.string().optional(),
  detectedEndBalance: z.string().optional(),
  fiscalYear: z.number().optional(),
  requiredMaterial: z.string().optional(),
  isReceived: z.boolean().optional(),
  displayFiscalMonth: z.number().optional(),
  currentMonth: z.number().optional(),
  features: z.string().optional(),
  accountHolder: z.string().optional(),
  expectedMaterials: z.string().optional(), // Buried key from seed
  accountType: z.string().optional(),
  detail: z.string().optional(),
  diff: z.string().optional(),
  thisMonthJournals: z.string().optional()
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

// ============================================================================
// 6. Inferred Types (Sacred Types)
// ============================================================================
export type ClientApi = z.infer<typeof ClientSchema>;
export type JobApi = z.infer<typeof JobSchema>;
export type JobStatusApi = z.infer<typeof JobStatusSchema>;
export type JournalLineApi = z.infer<typeof JournalLineSchema>;
export type TaxOptionApi = { label: string; value: string; rate: number; code: string }; // Manual definition as it's not a Zod Object in this file but exported as constant in schema_dictionary.
// Wait, TaxOptionSchema was local in index.ts.
// schema_dictionary exports the constant TAX_OPTIONS.
// If I need a type for TaxOption, I should infer it from the constant or define it here.
// But usage in jobRepository is JobApi.
