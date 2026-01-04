/**
 * ============================================================
 * ui.type.ts
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
  | 0
  | 'unknown';

export type TaxFilingTypeUi = 'blue' | 'white';
export type ConsumptionTaxModeUi = 'general' | 'simplified' | 'exempt';

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
    readonly taxCode: string;
  };

  readonly credit: {
    readonly account: string;
    readonly subAccount: string;
    readonly amount: number;
    readonly taxRate: TaxRateUi;
    readonly taxCode: string;
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

  // Screen B Dashboard Helpers
  readonly primaryDescription: string;
  readonly aiConfidenceLabel: string;
  readonly transactionDateLabel: string; // Alias for formatted date

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
    // Multi-line support
    readonly debits: readonly { readonly account: string; readonly subAccount: string; readonly amount?: number; readonly taxRate?: TaxRateUi; }[];
    readonly credits: readonly { readonly account: string; readonly subAccount: string; readonly amount?: number; readonly taxRate?: TaxRateUi; }[];
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
  readonly staffName: string; // Added
  readonly type: 'corp' | 'individual'; // Added
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
  readonly calculationMethodLabel: string;

  // Drive
  readonly driveLinked: boolean;
  readonly driveLinks: {
    readonly storage: string;
    readonly journalOutput: string;
    readonly journalExclusion: string;
    readonly pastJournals: string;
  };

  // Actions (BFF)
  readonly actions: readonly {
    readonly type: 'edit' | 'delete';
    readonly label: string;
    readonly isEnabled: boolean;
  }[];

  // Folder IDs
  readonly sharedFolderId: string;
  readonly processingFolderId: string;
  readonly archivedFolderId: string;
  readonly excludedFolderId: string;
  readonly csvOutputFolderId: string;
  readonly learningCsvFolderId: string;

  // New Fields
  readonly accountingSoftware: 'yayoi' | 'freee' | 'mf' | 'other';
  readonly defaultTaxRate: number;
  readonly taxMethod: 'inclusive' | 'exclusive';
  readonly taxCalculationMethod: 'stack' | 'back';
  readonly isInvoiceRegistered: boolean;
  readonly roundingSettings: 'floor' | 'round' | 'ceil';
  readonly invoiceRegistrationNumber: string;

  // Tax Raw Data (Required for Edit)
  readonly consumptionTaxMode: ConsumptionTaxModeUi;
  readonly simplifiedTaxCategory?: 1 | 2 | 3 | 4 | 5 | 6;
  readonly taxFilingType: TaxFilingTypeUi;

  // New Labels
  readonly taxCalculationMethodLabel: string;
  readonly roundingSettingsLabel: string;
  readonly invoiceRegistrationLabel: string;
  readonly simplifiedTaxCategoryLabel: string;
  readonly typeLabel: string;

  readonly taxMethodLabel: string;
  readonly calcMethodShortLabel: string;
}

export type TaxCalculationMethodUi = 'stack' | 'back';
export type RoundingSettingsUi = 'floor' | 'round' | 'ceil';

/* ============================================================
 * Detail UI 型 (Screen A Detail)
 * ============================================================
 */
export type DriveLinkUi = {
  readonly title: string;
  readonly path: string;
  readonly url: string;
  readonly iconColorClass: string;
  readonly isLinked: boolean;
};

export interface ClientDetailUi extends ClientUi {
  readonly healthScore: number;
  readonly healthScoreLabel: string;

  // Detail Specific Labels (Override or Additions)
  readonly consumptionTaxModeLabel: string;
  readonly taxMethodExplicitLabel: string;
  readonly fractionAdjustmentLabel: string;
  readonly defaultTaxRateLabel: string;

  readonly simplifiedTaxCategoryMessage: string;
  readonly hasSimplifiedTaxWarning: boolean;

  readonly driveFolderLinks: readonly DriveLinkUi[];

  readonly stats: {
    readonly collectionRate: number;
    readonly journalEntryRate: number;
    readonly infoPendingCount: number;
  };

  readonly recentActivities: readonly {
    readonly icon: string;
    readonly iconColorClass: string;
    readonly title: string;
    readonly dateLabel: string;
  }[];
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

  // Actions (BFF)
  readonly actions: readonly {
    readonly type: 'download' | 'delete';
    readonly label: string;
    readonly isEnabled: boolean;
  }[];
};


/* ============================================================
 * Screen E: Journal Entry UI 型 (BFF Standard)
 * ============================================================
 */
export type AiProposalUi = {
  readonly hasProposal: boolean;
  readonly confidenceLabel: string;
  readonly reason: string;
  readonly summary?: string;
  readonly debits: readonly {
    readonly account: string;
    readonly subAccount: string;
    readonly amount?: number;
    readonly taxRate?: number;
  }[];
  readonly credits: readonly {
    readonly account: string;
    readonly subAccount: string;
    readonly amount?: number;
    readonly taxRate?: number;
  }[];
};

export type JournalEntryActionUi = {
  readonly id: string; // 'save', 'approve', etc.
  readonly label: string;
  readonly disabled: boolean;
  readonly style?: string; // 'primary', 'secondary', 'danger'
};

export type JournalEntryAlertUi = {
  readonly title: string;
  readonly message: string;
  readonly level: 'info' | 'warning' | 'error';
};

export type JournalEntryUi = {
  readonly id: UiId;
  readonly clientCode: string;
  readonly companyName: string;
  readonly transactionDate: UiDateTime;
  readonly summary: string;
  readonly status: string;
  readonly statusLabel: string;

  readonly isLocked: boolean;
  readonly canEdit: boolean;
  readonly journalEditMode: 'work' | 'approve' | 'remand' | 'locked';

  readonly lines: readonly JournalLineUi[]; // Reuse existing
  readonly totalAmount: number;

  readonly aiProposal?: AiProposalUi;
  readonly alerts: readonly JournalEntryAlertUi[];
  readonly actions: readonly JournalEntryActionUi[];

  readonly driveFileUrl: string;
};
