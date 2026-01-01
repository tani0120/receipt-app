/**
 * ============================================================
 * aaa_ui.type.ts
 * ------------------------------------------------------------
 * 役割:
 *   - UIが唯一参照する「完成形データ型」
 *
 * この型の性質:
 *   ✅ optional / null / undefined が存在しない
 *   ✅ UIは if / fallback / 解釈を一切書けない
 *   ✅ 表示に必要な意味がすべて明示されている
 *
 * 禁止事項:
 *   ❌ API都合の構造を持ち込む
 *   ❌ number / enum の意味解釈を UI に残す
 *   ❌ 可変性 (readonly 必須)
 * ============================================================
 */

/* ============================================================
 * 共通UI型
 * ============================================================
 */

export type UiDateTime = string; // フォーマット済み (e.g. "2024/01/01")
export type UiId = string;

/* ============================================================
 * Job UI 型
 * ============================================================
 */

export type JobStatusUi =
  | 'pending'
  | 'in_progress'
  | 'review'
  | 'waiting'
  | 'completed'
  | 'error'
  | 'excluded'
  | 'unknown';

export type TaxRateUi =
  | 10
  | 8
  | 0
  | 'unknown';

export type StepStateUi = 'pending' | 'processing' | 'done' | 'error' | 'ready' | 'none';

export type JobStepUi = {
  readonly state: StepStateUi;
  readonly label: string;
  readonly count: number;
};

export type JobActionUi = {
  readonly type: 'rescue' | 'work' | 'approve' | 'remand' | 'export' | 'archive' | 'complete_all' | 'none';
  readonly label: string;
  readonly isEnabled: boolean;
};

export type JournalLineUi = {
  readonly lineNo: number;

  readonly debit: {
    readonly account: string;
    readonly subAccount: string;
    readonly amount: number;
    readonly taxRate: TaxRateUi;
  };

  readonly credit: {
    readonly account: string;
    readonly subAccount: string;
    readonly amount: number;
    readonly taxRate: TaxRateUi;
  };

  readonly description: string;
};

export type JobUi = {
  readonly id: UiId;
  readonly clientCode: string;
  /**
   * [CONTRACT] 表示用クライアント名
   * - データ欠損時も "Unknown (Code)" 等で必ず埋めること
   * - UI側での "undefined" チェックは禁止
   */
  readonly clientName: string;

  readonly status: JobStatusUi;

  // Helpers and labels
  readonly statusLabel: string;
  readonly statusColor: string;

  readonly softwareLabel: string; // 'freee', 'yayoi' etc
  readonly fiscalMonthLabel: string; // "3月決算"

  readonly priority: 'high' | 'normal' | 'low';

  // Dates (Formatted Strings)
  readonly transactionDate: UiDateTime;
  readonly createdAt: UiDateTime;
  readonly updatedAt: UiDateTime;

  readonly confidenceScore: number;
  readonly hasAiResult: boolean;

  readonly errorMessage: string;

  /**
   * [CONTRACT] 仕訳行
   * - 必ず配列として存在する (空配列可)
   * - null/undefined 禁止
   */
  readonly lines: readonly JournalLineUi[];

  readonly isLocked: boolean;

  // Screen B Grid Steps (Ironclad logic pre-calculated)
  readonly steps: {
    readonly receipt: JobStepUi;
    readonly aiAnalysis: JobStepUi;
    readonly journalEntry: JobStepUi;
    readonly approval: JobStepUi;
    readonly remand: JobStepUi;
    readonly export: JobStepUi;
    readonly archive: JobStepUi;
  };

  // Screen B Actions
  readonly primaryAction: JobActionUi;
  readonly nextAction: JobActionUi;

  // Screen E Properties (Editing & Validation)
  readonly journalEditMode: 'work' | 'remand' | 'approve' | 'locked';
  readonly alerts: readonly { readonly level: 'error' | 'warning' | 'info', readonly title: string, readonly message: string }[];
  readonly canEdit: boolean;
  readonly driveFileUrl: string;

  readonly aiProposal: {
    readonly hasProposal: boolean;
    readonly reason: string;
    readonly confidenceLabel: string;
    readonly account: string;
    readonly subAccount: string;
    readonly summary: string;
  };

  // Deep objects safe guarding (Ironclad Rule 4)
  readonly invoiceValidationLog: {
    readonly isValid: boolean;
    readonly registrationNumber: string;
    readonly checkedAtLabel: string;
    readonly isChecked: boolean;
  };

  readonly aiUsageStats: {
    readonly inputTokens: number;
    readonly outputTokens: number;
    readonly estimatedCostUsd: number;
    readonly modelName: string;
  };

  // Row Styling
  readonly rowStyle: string; // e.g. "bg-white"
};

export interface ClientUi {
  readonly clientCode: string;
  readonly companyName: string;
  readonly repName: string;
  readonly fiscalMonth: number;
  readonly status: 'active' | 'inactive' | 'suspension';

  // Mapped Status
  readonly isActive: boolean;

  // Contact Info (Dumb UI)
  readonly contact: {
    readonly type: 'email' | 'chatwork' | 'none';
    readonly value: string;
  };

  // Labels
  readonly fiscalMonthLabel: string;
  readonly softwareLabel: string;
  readonly taxInfoLabel: string;

  // Drive
  readonly driveLinked: boolean;
  readonly driveLinks: {
    readonly storage: string;
    readonly journalOutput: string;
    readonly journalExclusion: string;
    readonly pastJournals: string;
  };
}


/* ============================================================
 * Screen G: Data Conversion UI 型
 * ============================================================
 */
export type ConversionSoftwareCode = 'Yayoi' | 'MF' | 'Freee' | 'Unknown';

export type ConversionLogUi = {
  readonly id: UiId;
  readonly timestamp: UiDateTime;

  /** [CONTRACT] 未入力・不明時は "Unknown Client" 等で埋める */
  readonly clientName: string;

  /** [CONTRACT] 未入力・不明時は "Unknown Software" 等 */
  readonly sourceSoftware: string;

  readonly targetSoftware: ConversionSoftwareCode;
  readonly targetSoftwareLabel: string; // "弥生会計" etc.

  readonly fileName: string;

  /** [CONTRACT] "1.2 MB" 等のマッパー済み文字列 */
  readonly fileSizeLabel: string;

  readonly downloadUrl: string;
  readonly isDownloaded: boolean;

  /** [CONTRACT] "未DL", "済" などの表示用ステータス */
  readonly statusLabel: string;
};

