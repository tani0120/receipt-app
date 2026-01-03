/**
 * ============================================================
 * aaa_mapper.ts
 * ------------------------------------------------------------
 * Ironclad の心臓部 (Defense Layer)
 *
 * 役割:
 *   - 不定形な入力 (unknown / API Res) を UI Contract に変換する
 *   - 防御的プログラミング (Null Safety, Fallback)
 * ============================================================
 */

import type { JobApi, JournalLineApi, ClientApi } from '../aaa_types/aaa_zod.type';
import type {
  JobUi,
  JournalLineUi,
  JobStatusUi,
  TaxRateUi,
  JobStepUi,
  JobActionUi,
  StepStateUi,
  ConversionLogUi,
  ConversionSoftwareCode
} from '../aaa_types/aaa_ui.type';

import { Timestamp } from 'firebase/firestore';

/* ============================================================
 * 内部ユーティリティ (Helpers)
 * ============================================================
 */

const toUiId = (id: unknown): string => {
  if (typeof id === 'string') return id;
  if (typeof id === 'number') return String(id);
  return 'missing_id';
};

const safeText = (value: unknown, fallback = ''): string => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  return fallback;
};

const safeNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === 'number') {
    return (Number.isNaN(value) || !Number.isFinite(value)) ? fallback : value;
  }
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return (isNaN(parsed) || !isFinite(parsed)) ? fallback : parsed;
  }
  return fallback;
};

const safeBoolean = (value: unknown): boolean => {
  return !!value;
};

const formatTimestamp = (ts: unknown): string => {
  if (!ts) return '—';

  // Firestore Timestamp
  if (typeof ts === 'object' && ts !== null && 'toDate' in ts && typeof (ts as any).toDate === 'function') {
    try {
      const date = (ts as Timestamp).toDate();
      return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
    } catch (e) {
      return 'Inv. Date';
    }
  }

  // Serialized Timestamp ({ seconds: number, nanoseconds: number })
  if (typeof ts === 'object' && ts !== null && 'seconds' in ts && typeof (ts as any).seconds === 'number') {
    try {
      const seconds = (ts as any).seconds as number;
      const date = new Date(seconds * 1000);
      return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
    } catch (e) {
      return 'Inv. Date';
    }
  }

  // String Date
  if (typeof ts === 'string') {
    // Basic check if it looks like a date? Or just return it if standardized?
    // For now, accept strings if they look like dates, or fallback
    return ts;
  }

  return '—';
};

/* ============================================================
 * 業務ルール (Business Rules)
 * ============================================================
 */

const mapJobStatus = (status: unknown): JobStatusUi => {
  const s = String(status ?? '');
  switch (s) {
    case 'pending': return 'pending';
    case 'ai_processing': return 'pending'; // UI groups these
    case 'ready_for_work': return 'in_progress';
    case 'primary_completed': return 'in_progress';
    case 'review': return 'review';
    case 'waiting_approval': return 'review';
    case 'remanded': return 'in_progress'; // Remand is work
    case 'approved': return 'completed'; // Approved is mostly done
    case 'generating_csv': return 'completed';
    case 'done': return 'completed';
    case 'excluded': return 'excluded';
    case 'error_retry': return 'error';
    default: return 'unknown';
  }
};

const mapJobStatusLabel = (status: JobStatusUi): string => {
  switch (status) {
    case 'pending': return '解析待ち';
    case 'in_progress': return '仕訳中';
    case 'review': return '承認待ち';
    case 'completed': return '完了';
    case 'error': return 'エラー';
    case 'excluded': return '対象外';
    case 'unknown': default: return '不明';
  }
};

const mapJobStatusColor = (status: JobStatusUi): string => {
  switch (status) {
    case 'pending': return 'bg-gray-100 text-gray-800';
    case 'in_progress': return 'bg-blue-100 text-blue-800';
    case 'review': return 'bg-pink-100 text-pink-800';
    case 'completed': return 'bg-green-100 text-green-800';
    case 'error': return 'bg-red-100 text-red-800';
    case 'excluded': return 'bg-gray-200 text-gray-500';
    case 'unknown': default: return 'bg-gray-100 text-gray-800';
  }
};

const mapTaxRate = (rate: unknown): TaxRateUi => {
  if (rate === 10 || rate === 8 || rate === 0) {
    return rate;
  }
  return 'unknown';
};

// --- Deep Dive Tax Translation Logic ---
const translateTaxCode = (code: unknown, client: Partial<ClientApi>, side: 'debit' | 'credit'): string => {
  const raw = String(code || '');
  if (!raw) return '';

  const mode = client.consumptionTaxMode || 'general';

  // 1. Exempt (免税)
  // AIが何を推論しても、システム側で強制的に TAX_EXEMPT (非課税/対象外)
  if (mode === 'exempt') {
    return 'TAX_NONE'; // Schema: TAX_NONE: 対象外/不課税
  }

  // 2. Simplified (簡易)
  if (mode === 'simplified') {
    // 売上 (Credit)
    if (side === 'credit') {
      // AI check: Specifically Taxable Sales (10% or 8%)
      // Caution: Do NOT capture TAX_SALES_EXPORT or TAX_SALES_NON_TAXABLE here
      if (raw.includes('TAX_SALES_10') || raw.includes('TAX_SALES_8') || raw.includes('課税売上')) {
        const cat = client.simplifiedTaxCategory || 3; // Default 3rd
        const isReduced = raw.includes('8_RED') || raw.includes('軽減');
        const rate = isReduced ? '8%' : '10%';
        const kanji = ['一', '二', '三', '四', '五', '六'][cat - 1] || '三';
        return `簡易${kanji}売 ${rate}`;
      }
      // Export/Exempt/None passes through as is (e.g., TAX_SALES_EXPORT)
      return raw;
    } else {
      // 仕入 (Debit) -> 対象外
      return '対象外';
    }
  }

  // 3. General (本則)
  // AI推論結果をそのまま使用
  return raw;
};

// --- Step Logic ---

const createStep = (state: StepStateUi = 'none', label = '', count = 0): JobStepUi => ({
  state, label, count
});

const calculateSteps = (api: Partial<JobApi>): JobUi['steps'] => {
  const s = api.status; // Access raw status directly or safely
  const statusStr = String(s ?? '');

  // Helper for lines
  const linesCount = Array.isArray(api.lines) ? api.lines.length : 0;

  // Initialize all steps (Mutable logic, then return as readonly)
  // We calculate each step first

  // Receipt
  const receipt = createStep('done', '受領済');

  // AI Analysis
  let aiAnalysis = createStep('none');
  if (statusStr === 'ai_processing') aiAnalysis = createStep('processing', '解析中');
  else if (statusStr === 'error_retry') aiAnalysis = createStep('error', 'エラー');
  else aiAnalysis = createStep('done', '完了'); // Default assumption: analysis done if not processing/error

  // Journal Entry
  let journalEntry = createStep('none');
  if (['pending', 'ai_processing', 'error_retry'].includes(statusStr)) {
    journalEntry = createStep('none');
  } else if (['ready_for_work', 'primary_completed', 'remanded'].includes(statusStr)) {
    journalEntry = createStep('pending', '仕訳待ち', linesCount);
  } else {
    journalEntry = createStep('done');
  }

  // Approval
  let approval = createStep('none');
  if (['review', 'waiting_approval'].includes(statusStr)) {
    approval = createStep('pending', '承認待ち', linesCount);
  } else if (['approved', 'done', 'generating_csv'].includes(statusStr)) {
    approval = createStep('done');
  }

  // Remand
  let remand = createStep('none');
  if (statusStr === 'remanded') {
    remand = createStep('pending', '差戻し', linesCount);
  }

  // Export
  let exportStep = createStep('none'); // 'export' is reserved word? no, but clearer name
  if (['approved', 'generating_csv'].includes(statusStr)) {
    exportStep = createStep('ready', '未出力');
  } else if (statusStr === 'done') {
    exportStep = createStep('done', '出力済');
  }

  // Archive
  let archive = createStep('none');
  if (['done', 'error_retry'].includes(statusStr)) {
    const count = statusStr === 'error_retry' ? 1 : 12;
    const label = statusStr === 'error_retry' ? '要確認' : '整理待ち';
    archive = createStep('ready', label, count);
  }

  return {
    receipt,
    aiAnalysis,
    journalEntry,
    approval,
    remand,
    export: exportStep,
    archive
  };
};

// --- Action Logic ---

const calculateActions = (api: Partial<JobApi>): { primary: JobActionUi, next: JobActionUi } => {
  const s = String(api.status ?? '');
  let primary: JobActionUi = { type: 'none', label: '', isEnabled: false };
  let next: JobActionUi = { type: 'none', label: '', isEnabled: false };

  switch (s) {
    case 'ai_processing':
      break;
    case 'error_retry':
      primary = { type: 'rescue', label: 'エラー確認', isEnabled: true };
      break;
    case 'ready_for_work':
    case 'remanded':
      primary = { type: 'work', label: '1次仕訳', isEnabled: true };
      break;
    case 'waiting_approval':
    case 'review':
      next = { type: 'approve', label: '最終承認', isEnabled: true };
      primary = { type: 'remand', label: '差戻し', isEnabled: true };
      break;
    case 'approved':
      primary = { type: 'export', label: 'CSV出力', isEnabled: true };
      break;
    case 'done':
      primary = { type: 'archive', label: '仕訳移動', isEnabled: true };
      break;
  }

  // Priority override for review
  if (['waiting_approval', 'review'].includes(s)) {
    primary = { type: 'approve', label: '最終承認', isEnabled: true };
  }

  return { primary, next };
};


/* ============================================================
 * JournalLine Mapper
 * ============================================================
 */

const mapJournalLine = (api: unknown, client: Partial<ClientApi>): JournalLineUi => {
  const d = (api && typeof api === 'object') ? (api as Record<string, any>) : {};

  // TaxDetails Safety
  const drTax = d.taxDetails?.rate; // unsafe access -> fixed

  return {
    lineNo: safeNumber(d.lineNo),

    debit: {
      account: safeText(d.drAccount),
      subAccount: safeText(d.drSubAccount),
      amount: safeNumber(d.drAmount),
      taxRate: mapTaxRate((d as any).taxDetails?.rate), // Safe enough via mapTaxRate
      taxCode: translateTaxCode(d.drTaxClass, client, 'debit'),
    },

    credit: {
      account: safeText(d.crAccount),
      subAccount: safeText(d.crSubAccount),
      amount: safeNumber(d.crAmount),
      taxRate: mapTaxRate((d as any).taxDetails?.rate),
      taxCode: translateTaxCode(d.crTaxClass, client, 'credit'),
    },

    description: safeText(d.description),
  };
};

/* ============================================================
 * Job Mapper（公開API）
 * ============================================================
 */

export const mapJobApiToUi = (
  input: unknown,
  clientInput?: unknown
): JobUi => {
  // 0. Defense: Cast to partials safely
  const api = (input && typeof input === 'object') ? (input as Partial<JobApi>) : {};
  const client = (clientInput && typeof clientInput === 'object') ? (clientInput as Partial<ClientApi>) : {};

  // 1. Safe Property Extraction
  const jobStatus = mapJobStatus(api.status);
  const steps = calculateSteps(api);
  const actions = calculateActions(api);

  // 2. Client Resolving
  const clientName = safeText(client.companyName, `Unknown (${safeText(api.clientCode, '?')})`);
  const softwareLabel = safeText(client.accountingSoftware, 'unknown');
  const fiscalMonthLabel = client.fiscalMonth ? `${client.fiscalMonth}月決算` : '決算月不明';

  // 3. Construct Complete UI Object
  return {
    id: toUiId(api.id || 'missing_id'),
    clientCode: safeText(api.clientCode, 'unknown'),
    clientName: clientName,

    status: jobStatus,
    statusLabel: mapJobStatusLabel(jobStatus),
    statusColor: mapJobStatusColor(jobStatus),

    softwareLabel: softwareLabel,
    fiscalMonthLabel: fiscalMonthLabel,

    priority: (api.priority === 'high' || api.priority === 'low') ? api.priority : 'normal',

    transactionDate: formatTimestamp(api.transactionDate),
    createdAt: formatTimestamp(api.createdAt),
    updatedAt: formatTimestamp(api.updatedAt),

    confidenceScore: safeNumber(api.confidenceScore),
    hasAiResult: !!api.aiAnalysisRaw,

    // Populating Screen B Helpers
    primaryDescription: Array.isArray(api.lines) && api.lines.length > 0 ? safeText(api.lines[0]?.description) : '摘要なし',
    aiConfidenceLabel: api.confidenceScore ? `AI信頼度: ${(api.confidenceScore * 100).toFixed(0)}%` : 'AI未解析',
    transactionDateLabel: formatTimestamp(api.transactionDate),

    errorMessage: safeText(api.errorMessage),

    lines: Array.isArray(api.lines) ? api.lines.map(l => mapJournalLine(l, client)) : [],

    isLocked: !!api.lockedByUserId,

    steps: steps,
    primaryAction: actions.primary,
    nextAction: actions.next,

    driveFileUrl: api.driveFileId ? `https://drive.google.com/file/d/${api.driveFileId}/view` : '',

    // Screen E Default Logic
    journalEditMode: 'work',
    alerts: [],
    canEdit: ['ready_for_work', 'remanded', 'error_retry'].includes(jobStatus),

    aiProposal: (() => {
      let parsed: any = null;
      if (api.aiAnalysisRaw) {
        try {
          parsed = JSON.parse(api.aiAnalysisRaw);
        } catch (e) { /* ignore */ }
      }

      const hasProposal = !!parsed;

      return {
        hasProposal,
        reason: hasProposal ? safeText(parsed.reason) : '',
        confidenceLabel: hasProposal ? (api.confidenceScore ? `信頼度: ${(api.confidenceScore * 100).toFixed(0)}%` : '高') : '',
        summary: hasProposal ? safeText(parsed.summary) : '',

        debits: (hasProposal && Array.isArray(parsed.debits)) ? parsed.debits.map((d: any) => ({
          account: safeText(d.account),
          subAccount: safeText(d.subAccount),
          amount: safeNumber(d.amount),
          taxRate: mapTaxRate(d.taxRate)
        })) : [],

        credits: (hasProposal && Array.isArray(parsed.credits)) ? parsed.credits.map((c: any) => ({
          account: safeText(c.account),
          subAccount: safeText(c.subAccount),
          amount: safeNumber(c.amount),
          taxRate: mapTaxRate(c.taxRate)
        })) : []
      };
    })(),

    // Ironclad Rule 4: Deep Logic
    invoiceValidationLog: {
      isValid: !!api.invoiceValidationLog?.isValid,
      registrationNumber: safeText(api.invoiceValidationLog?.registrationNumber),
      checkedAtLabel: formatTimestamp(api.invoiceValidationLog?.checkedAt),
      isChecked: !!api.invoiceValidationLog
    },

    aiUsageStats: {
      inputTokens: safeNumber(api.aiUsageStats?.inputTokens),
      outputTokens: safeNumber(api.aiUsageStats?.outputTokens),
      estimatedCostUsd: safeNumber(api.aiUsageStats?.estimatedCostUsd),
      modelName: safeText(api.aiUsageStats?.modelName, 'unknown'),
    },

    rowStyle: 'bg-white'
  };
};

export const mapConversionLogUi = (input: unknown): ConversionLogUi => {
  const d = (input && typeof input === 'object') ? (input as any) : {};

  // 1. Target Software Mapping (Pure Logic)
  let targetCode: ConversionSoftwareCode = 'Unknown';
  let targetLabel = '不明';
  const rawTarget = String(d.targetSoftware || '');

  if (rawTarget === 'Yayoi' || rawTarget === '弥生会計') { targetCode = 'Yayoi'; targetLabel = '弥生会計'; }
  else if (rawTarget === 'Freee' || rawTarget === 'freee') { targetCode = 'Freee'; targetLabel = 'freee'; }
  else if (rawTarget === 'MF' || rawTarget === 'マネーフォワード') { targetCode = 'MF'; targetLabel = 'マネーフォワード'; }

  // 2. File Size Logic (Mock or Real)
  // If API provides size bytes, format it. If not, mock it safely (never show undefined).
  const sizeBytes = safeNumber(d.sizeBytes || d.size, 0);
  let sizeLabel = '0 KB';
  if (sizeBytes > 0) {
    if (sizeBytes < 1024 * 1024) sizeLabel = `${(sizeBytes / 1024).toFixed(1)} KB`;
    else sizeLabel = `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
  } else {
    // Fallback for mocks lacking size
    sizeLabel = 'Unknown Size';
  }

  // 3. Status Label (Pure Logic)
  const isDownloaded = !!d.isDownloaded;
  const statusLabel = isDownloaded ? 'ダウンロード済' : '未ダウンロード';

  return {
    id: toUiId(d.id),
    timestamp: formatTimestamp(d.timestamp),
    clientName: safeText(d.clientName, 'Unknown Client'),
    sourceSoftware: safeText(d.sourceSoftware, 'Unknown Source'),

    targetSoftware: targetCode,
    targetSoftwareLabel: targetLabel,

    fileName: safeText(d.fileName, 'untitled.csv'),
    fileSizeLabel: sizeLabel,

    downloadUrl: safeText(d.downloadUrl, '#'),
    isDownloaded: isDownloaded,
    statusLabel: statusLabel
  };
};
