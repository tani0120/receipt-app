/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CRITICAL: AI TYPE SAFETY RULES - MUST FOLLOW WITHOUT EXCEPTION
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * 【型安全性ルール - AI必須遵守事項】
 *
 * ❌ 禁止事項（6項目）- NEVER DO THESE:
 * 1. Partial<T> + フォールバック値 (client.name || 'XXX') - TYPE CONTRACT DESTRUCTION
 * 2. any型（実装済み機能） - TYPE SYSTEM ABANDONMENT
 * 3. status フィールドの無視 - AUDIT TRAIL DESTRUCTION
 * 4. Zodスキーマでのany型 (z.any()) - SCHEMA LEVEL TYPE ABANDONMENT
 * 5. 型定義ファイルでのany型 (interface { field: any }) - INTERFACE LEVEL DESTRUCTION
 * 6. 型定義の二重管理（新旧スキーマ混在） - TYPE DEFINITION CONFLICT
 *
 * ✅ 許可事項（3項目）- ALLOWED:
 * 1. 将来のフェーズ未実装機能でのeslint-disable + throw new Error()
 * 2. unknown型の使用（型ガードと組み合わせて）
 * 3. 必要最小限の型定義（Pick<T>, Omit<T>等）
 *
 * 詳細: complete_evidence_no_cover_up.md
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { Timestamp } from "firebase/firestore";

/**
 * Firestore Collection Definitions
 * Fully aligned with the 'Deep Dive' Specification and User Decisions (Rev. Final)
 */

// ============================================================================
// 0. Enums & Shared Types (共通定義)
// ============================================================================

export type TaxFilingType = 'blue' | 'white'; // 青色 / 白色
export type ConsumptionTaxMode = 'general' | 'simplified' | 'exempt'; // 本則 / 簡易 / 免税
export type SimplifiedTaxCategory = 1 | 2 | 3 | 4 | 5 | 6; // 簡易課税事業区分

export type JobStatus =
  | 'pending'           // 受領直後 (Phase 1)
  | 'ai_processing'     // AI解析中 (Phase 1-2)
  | 'ready_for_work'    // 仕訳作業待ち (Screen E) (Phase 3)
  | 'primary_completed' // 1次完了 (Internal)
  | 'review'            // 承認待ち (Alias/Internal)
  | 'waiting_approval'  // 承認待ち (Screen B) (Phase 4)
  | 'remanded'          // 差戻し (Screen B -> E)
  | 'approved'          // 承認済み (Phase 5)
  | 'generating_csv'    // CSV生成中
  | 'done'              // 完了 (アーカイブ済)
  | 'error_retry'       // エラー / 再試行待ち
  | 'excluded';         // 除外

export type JobPriority = 'high' | 'normal' | 'low';

export type TaxType =
  | 'taxable'
  | 'non_taxable'     // 非課税
  | 'exempt'          // 免税 (輸出等)
  | 'out_of_scope'    // 不課税/対象外
  | 'reverse_charge'; // リバースチャージ

export type InvoiceIssuerType =
  | 'qualified'       // 適格請求書発行事業者
  | 'transitional_80' // 経過措置 (80%控除)
  | 'transitional_50' // 経過措置 (50%控除)
  | 'non_qualified'   // 適格以外 (控除不可)
  | 'unknown';        // 未判定

// ============================================================================
// 1. Clients Collection (顧問先マスタ)
// Collection ID: 'clients'
// Document ID: Client 3-letter Code (e.g., 'AMT')
// ============================================================================
export interface Client {
  /** Internal Symbol: CLIENT_CODE */
  clientCode: string;

  /** Internal Symbol: COMPANY_NAME */
  companyName: string;

  /** Week 3: Company Name Kana */
  companyNameKana?: string;

  /** Client Type */
  type?: 'corp' | 'individual';

  /** Internal Symbol: REP_NAME */
  repName?: string;

  /** Week 3: Representative Name Kana */
  repNameKana?: string;

  /** Staff Member */
  staffName?: string;

  /** Internal Symbol: CONTACT_INFO */
  contactInfo?: string; // Slack webhook or email

  /** Week 3: Phone Number */
  phoneNumber?: string;

  /** Internal Symbol: FISCAL_MONTH (1-12) */
  fiscalMonth: number;

  /** Week 3: Established Date (YYYYMMDD) */
  establishedDate?: string;

  /** Internal Symbol: STATUS */
  status: 'active' | 'inactive' | 'suspension';

  /**
   * Folder Rules (File Storage)
   * aligned with Deep Dive "Folder Storage Rules"
   */
  sharedFolderId: string;    // 入口 (Entrance)
  processingFolderId: string; // 一時保管 (Processing / Sanctuary) - formerly originalFolderId
  archivedFolderId: string;   // 保管 (Archived) - Auto-delete after 40 days
  excludedFolderId: string;   // 除外 (Excluded)
  csvOutputFolderId: string;  // CSV出力 (Combined for MF/Freee/Yayoi)
  learningCsvFolderId: string; // 学習用 (Historical Data)

  /** Tax Settings */
  taxFilingType: TaxFilingType;
  consumptionTaxMode: ConsumptionTaxMode;
  simplifiedTaxCategory?: SimplifiedTaxCategory;

  /**
   * Internal Symbol: DEFAULT_TAX_RATE
   * Overrides system default if set
   */
  defaultTaxRate?: number;

  /**
   * Accounting Software (Target for CSV)
   * Internal Symbol: ACCOUNTING_SOFT
   * Week 3: Added 'tkc'
   */
  accountingSoftware: 'yayoi' | 'freee' | 'mf' | 'tkc' | 'other';

  /**
   * Prompt Injection for this specific client
   * Internal Symbol: AI_KNOWLEDGE_PROMPT
   */
  aiKnowledgePrompt?: string;

  /**
   * Default Payment Method (Week 3: Updated)
   * Use for guessing payment method when OCR cannot detect
   */
  defaultPaymentMethod?: 'cash' | 'owner_loan' | 'accounts_payable';

  /**
   * Calculation Method
   */
  calculationMethod?: 'accrual' | 'cash' | 'interim_cash';

  /**
   * Week 3: Department Management
   */
  hasDepartmentManagement?: boolean;

  /**
   * Week 3: Fee Settings (Optional for backward compatibility)
   */
  advisoryFee?: number;      // 顧問報酬（月額）
  bookkeepingFee?: number;   // 記帳代行（月額）
  settlementFee?: number;    // 決算報酬（年次）
  taxFilingFee?: number;     // 消費税申告報酬（年次）

  /** Google Drive Link Status */
  driveLinked: boolean;

  updatedAt: Timestamp;
}

// ============================================================================
// 2. Jobs Collection (ジョブ管理 + 仕訳詳細)
// Collection ID: 'jobs'
// Document ID: Auto-generated
// ============================================================================

export interface JournalLine {
  /** UI_E_LINE_NO */
  lineNo: number;

  /** Debit Side */
  drAccount: string;
  drSubAccount?: string;
  drAmount: number;
  drTaxClass?: string; // Derived from TaxType + Rate + Invoice
  drTaxAmount?: number; // For strictly tax-excluded accounting

  /** Credit Side */
  crAccount: string;
  crSubAccount?: string;
  crAmount: number;
  crTaxClass?: string;
  crTaxAmount?: number;

  /** Meta */
  description: string; // 摘要
  departmentCode?: string;
  note?: string; // Internal Memo

  /**
   * Invoice System status for this line
   * Crucial for Deep Dive "Tax Logic"
   */
  invoiceIssuer?: InvoiceIssuerType;

  /**
   * Specific Tax Details (Overrides string class if needed)
   */
  taxDetails?: {
    rate: 10 | 8 | 0;
    type: TaxType;
    isReducedRate: boolean;
  };

  /** AI Reasoning / Flags */
  isAutoMaster?: boolean; // Generated by Rule?
  flags?: {
    isTenThousandYen?: boolean; // >100k asset check
    isSocialExpense?: boolean;  // >5000 yen entertainment check
    isTaxDiff?: boolean;        // Tax calculation discrepancy
  };
}

export interface Job {
  /** Internal Symbol: JOB_ID */
  id: string;

  /** Internal Symbol: CLIENT_CODE */
  clientCode: string;

  /** Internal Symbol: DRIVE_FILE_ID */
  driveFileId: string; // Validated existence in 'processingFolderId'

  /** Internal Symbol: DRIVE_FILE_URL */
  driveFileUrl?: string;

  /** Internal Symbol: JOB_STATUS */
  status: JobStatus;

  priority: JobPriority;

  /** Internal Symbol: RETRY_COUNT (Max 3) */
  retryCount: number;

  /** Accounting Date */
  transactionDate: Timestamp;

  /** Timestamps */
  createdAt: Timestamp; // File Scanned Time
  startedAt?: Timestamp; // AI Processing Start
  finishedAt?: Timestamp; // Approved/Archived Time
  updatedAt: Timestamp;

  /** Locking Mechanism */
  lockedByUserId?: string;
  lockedAt?: Timestamp;

  /**
   * AI Analysis Data
   */
  confidenceScore: number;
  aiAnalysisRaw?: string; // JSON string

  /**
   * AI Usage Stats (Cost Calculation)
   */
  aiUsageStats?: {
    inputTokens: number;
    outputTokens: number;
    estimatedCostUsd: number;
    modelName: string;
  };

  /**
   * National Tax Agency API Log
   * "T番号照合ログ (JOB_T_NUM_LOG)"
   */
  invoiceValidationLog?: {
    registrationNumber?: string; // T123456...
    isValid: boolean;
    apiResponse?: any; // Raw response from NTA API
    checkedAt: Timestamp;
  };

  /**
   * Logical Phase Tracking (current phase 1-7)
   */
  currentPhase?: number;

  /** Error Handling */
  errorMessage?: string; // For 'error_retry' status

  /** The Actual Journal Entries */
  lines: JournalLine[];

  /** Detection/Logic Alerts */
  detectionAlerts?: {
    code: string; // e.g., 'E001_DUPLICATE'
    message: string;
    severity: 'info' | 'warning' | 'critical';
  }[];

  /** Review Status passed from Draft to Approval */
  reviewStatus?: 'confirmed' | 'unknown' | 'exclude_candidate';
}

// ============================================================================
// 3. Learning Rules Collection (学習ルールDB)
// Collection ID: 'learning_rules'
// Source: @04_学習ルールDB
// ============================================================================
export interface LearningRule {
  id: string;
  clientCode: string; // Global rules have 'ALL' or empty

  keyword: string;     // Matching condition
  targetField: 'description' | 'vendor' | 'amount_range';

  /** The Result to Apply */
  accountItem: string;
  subAccount?: string;
  taxClass?: string;

  /** Metrics */
  confidenceScore: number; // 0.0-1.0
  hitCount: number;        // Usage count
  lastAppliedJobId?: string;

  isActive: boolean;
  updatedAt: Timestamp;
}

// ============================================================================
// 4. Audit Logs Collection (監査ログ)
// Collection ID: 'audit_logs'
// Source: @08_監査ログ
// ============================================================================
export interface AuditLog {
  id: string;
  logTimestamp: Timestamp;

  userId: string;       // LOG_USER
  userEmail?: string;

  action: 'APPROVE' | 'REJECT' | 'MODIFY' | 'LOGIN' | 'EMERGENCY_STOP' | 'CONFIG_CHANGE';

  screenId?: string;    // LOG_SCREEN_ID (e.g., 'Screen_E')
  logicId?: string;     // LOG_LOGIC_ID (e.g., 'L-001')

  targetCollection: 'jobs' | 'clients' | 'system_settings';
  targetId?: string;

  /** Diff Storage */
  previousData?: any;   // LOG_OLD_DATA
  newData?: any;        // LOG_NEW_DATA
}

// ============================================================================
// 5. System Settings Collection (環境設定)
// Collection ID: 'system_settings'
// Document ID: 'v1'
// ============================================================================
export interface SystemSettings {
  systemStatus: 'ACTIVE' | 'PAUSE' | 'EMERGENCY_STOP';

  /** LLM Configuration */
  aiModelName: string; // e.g., 'gemini-1.5-pro-latest'
  geminiApiKey?: string; // User Input Required

  /** Invoice API Configuration */
  invoiceSystemApiKey?: string; // User Input Required (Application ID)

  /** Cost Configuration */
  apiUnitCostIn: number;
  apiUnitCostOut: number;
  usdJpyRate: number;

  /** Operational Limits */
  maxRetries: number;     // default 3
  dataRetentionDays: number; // default 40

  updatedAt: Timestamp;
}

// ============================================================================
// 6. Bank Fingerprints (銀行特定フィンガープリント)
// ============================================================================
export interface BankFingerprint {
  bankName: string;
  primaryColor: string;
  keywords: string[];
  layoutType: string;
}

// ============================================================================
// 7. Sub-Resources (Bank Accounts / Credit Cards)
// ============================================================================
export interface BankAccount {
  id: string;
  bankName: string;
  branchName?: string;
  accountType: 'ordinary' | 'current';
  accountNumber: string;
  accountHolder: string;
  updatedAt: Timestamp;
}

export interface CreditCard {
  id: string;
  cardName: string;
  cardHolder: string;
  last4Digits: string;
  paymentAccountBankId?: string; // Link to BankAccount
  updatedAt: Timestamp;
}
