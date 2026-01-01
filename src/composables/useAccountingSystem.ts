
import { ref, reactive, computed } from 'vue';
import { FirestoreRepository } from '../services/firestoreRepository';
import { JobService } from '../services/JobService';
import type { Client, Job, SystemSettings, JobStatus, JournalLine, LearningRule, AuditLog } from '../types/firestore';
import { Timestamp } from 'firebase/firestore';
import { useBankLogic } from './useBankLogic';

// ========================================================================
// 📊 Spreadsheet Schema & Mock Data Definition (Deep Dive Compliant)
// ========================================================================

// Re-export types for components
export type { Client, Job, JobStatus, JournalLine, LearningRule, AuditLog };

// ========================================================================
// 🏗️ Data Types & Interfaces
// ========================================================================

/**
 * クライアントの現在のメインアクション（優先順位順）
 */
export enum ClientActionType {
  Rescue = 'rescue',   // エラー確認
  Work = 'work',       // 1次仕訳
  Remand = 'remand',   // 差戻対応
  Approve = 'approve', // 最終承認
  Export = 'export',   // CSV出力
  Archive = 'archive', // 移動
  Done = 'done'        // 完了
}

export type StepState = 'pending' | 'processing' | 'done' | 'error' | 'ready' | 'none';

export interface StepStatus {
  state: StepState;
  label?: string;
  count?: number;
  errorMsg?: string;
  drivePath?: string; // ドライブ連携用パス
}

export interface NextAction {
  type: ClientActionType;
  label: string;
  icon: string;
  modalContext?: {
    type: 'normal' | 'error';
    title: string;
    subtitle?: string;
    targetPath: string;
    icon?: string;
    iconBg?: string;
  };
}

// ------------------------------------------------------------------
// Deep Dive Mock Data Generator
// ------------------------------------------------------------------

function createMockJob(
  id: string,
  dateStr: string,
  vendor: string,
  desc: string,
  amount: number,
  status: JobStatus,
  debitAccount: string,
  taxConf: { type: string, rate: number } = { type: 'taxable', rate: 10 }
): Job {
  const line: JournalLine = {
    lineNo: 1,
    drAccount: debitAccount,
    drSubAccount: vendor,
    drAmount: amount,
    drTaxClass: `課対仕入${taxConf.rate}%`, // Simple mock string, real logic in Phase 3
    crAccount: '未払金',
    crAmount: amount,
    crTaxClass: '対象外',
    description: desc,
    invoiceIssuer: 'qualified',
    taxDetails: {
      rate: taxConf.rate as 10 | 8 | 0,
      type: taxConf.type as any,
      isReducedRate: false
    }
  };

  return {
    id,
    clientCode: 'MOCK',
    driveFileId: `file_${id}`,
    status,
    priority: 'normal',
    retryCount: 0,
    transactionDate: Timestamp.fromDate(new Date(dateStr)),
    createdAt: Timestamp.fromDate(new Date(dateStr)),
    updatedAt: Timestamp.now(),
    confidenceScore: 0.9,
    lines: [line],
    aiUsageStats: { inputTokens: 500, outputTokens: 100, estimatedCostUsd: 0.002, modelName: 'gemini-2.0-flash-exp' }
  };
}

const MOCK_JOBS: Job[] = [
  // 1. Draft Test (For "1次仕訳" button)
  createMockJob('job_draft_01', '2024-12-01', '株式会社 テスト商事', '1次仕訳テスト用 (消耗品)', 10000, 'ready_for_work', '消耗品費'),

  // 2. Remand Test (For "差戻対応" button)
  createMockJob('job_remand_01', '2024-12-02', '株式会社 テスト商事', '差戻しテスト用 (交通費)', 20000, 'remanded', '旅費交通費'),

  // 3. Approval Test (For "最終承認" button)
  createMockJob('job_approve_01', '2024-12-03', '株式会社 テスト商事', '承認テスト用 (接待費)', 30000, 'waiting_approval', '接待交際費'),

  // 4. Completed Test (For history/reference)
  createMockJob('job_done_01', '2024-11-30', '株式会社 テスト商事', '完了済みデータ', 5000, 'approved', '雑費'),

  // --- RESTORED DATA FOR OTHER SCREENS ---
  // Others (Preserved for Screen A, C, etc.)
  createMockJob('1002_job01', '2024-11-13', 'Amazon.co.jp', '複合仕訳テスト', 50000, 'ready_for_work', '消耗品費'),
  createMockJob('1003_job01', '2024-11-14', '不明株式会社', '(新規取引)', 10000, 'pending', '仮払金'),
  createMockJob('2001_job01', '2024-11-15', '株式会社サンプル商事', 'オフィス用品一式', 15800, 'approved', '消耗品費'),
];

// Correct Client Codes Mappings
MOCK_JOBS.forEach(j => {
  if (j.id.startsWith('job_')) j.clientCode = '1001'; // Force our test jobs to 1001
  else if (j.id.startsWith('1002')) j.clientCode = '1002';
  else if (j.id.startsWith('1003')) j.clientCode = '1003';
  else if (j.id.startsWith('2001')) j.clientCode = '2001';
  else j.clientCode = '2005';
});

// Complex Job (Multi-line) replacement for 1002_job01
// Complex Job (Multi-line) replacement for 1002_job01 -> REMOVED FOR MAIN RESTORATION
// Original simple logic preserved below

// Aggregated Credit line for display is usually calculated by UI, but here we store as separate balanced lines or 1:N.
// Firestore definition allows 'lines' to be arbitrary. For now, we assume simple lines.


// ========================================================================
// 📊 Admin Dashboard Data Types
// ========================================================================

export interface StaffPerformance {
  name: string;
  backlogs: {
    draft: number;
    remand: number;
    approve: number;
    total: number;
  };
  velocity: {
    draftAvg: number;
    approveAvg: number;
  };
}

export interface SystemKPI {
  monthlyJournals: number;
  autoConversionRate: number;
  aiAccuracy: number;
  funnel: {
    received: number;
    processed: number;
    exported: number;
  };
  monthlyTrend: number[];
}

const MOCK_ADMIN_DATA: { kpi: SystemKPI; staff: StaffPerformance[] } = {
  kpi: {
    monthlyJournals: 12450,
    autoConversionRate: 85.2,
    aiAccuracy: 92.5,
    funnel: { received: 3500, processed: 2800, exported: 3100 },
    monthlyTrend: [1000, 1050, 980, 1100, 1200, 1150, 1080, 1020, 1300, 1100, 1050, 1420]
  },
  staff: [
    { name: "鈴木 一郎", backlogs: { draft: 42, remand: 2, approve: 40, total: 84 }, velocity: { draftAvg: 155, approveAvg: 197 } },
    { name: "管理者 太郎", backlogs: { draft: 0, remand: 1, approve: 10, total: 11 }, velocity: { draftAvg: 50, approveAvg: 12 } }
  ]
};

// ========================================================================
// 🧠 AI Logic Map (7 Phases) - Deep Dive Implementation
// ========================================================================
export const TAX_LOGIC = {
  // Phase 2: BS Transactions
  isBSTransaction(item: string): boolean {
    return item.includes('振替') || item.includes('移動') || item.includes('資金');
  },
  // Phase 3: Tax Free / Exempt
  isTaxFree(vendor: string, item: string): boolean {
    return vendor.includes('免税') || item.includes('切手') || item.includes('印紙');
  },
  // Phase 4: Payroll
  isPayroll(item: string): boolean {
    return item.includes('給与') || item.includes('役員報酬') || item.includes('法定福利');
  },
  // Phase 5: Asset
  isAsset(amount: number, item: string): boolean {
    return amount >= 100000; // Simplified
  }
};

function determineAccountItem(amount: number, item: string, vendor: string): { debit: string; reason: string } {
  // Logic Implementation mirroring Deep Dive Spec
  if (TAX_LOGIC.isBSTransaction(item)) return { debit: '現金', reason: 'Phase 2: BS取引(資金移動)' };
  if (TAX_LOGIC.isTaxFree(vendor, item)) return { debit: '通信費(非課税)', reason: 'Phase 3: 非課税/免税' };
  if (TAX_LOGIC.isPayroll(item)) return { debit: '給与手当', reason: 'Phase 4: 給与/政策' };

  if (amount >= 100000) return { debit: '工具器具備品', reason: 'Phase 5: 固定資産(10万円超)' };

  if (item.includes('タクシー')) return { debit: '旅費交通費', reason: 'Phase 6: 一般推論(移動)' };
  if (item.includes('会議') || item.includes('コーヒー')) return { debit: '会議費', reason: 'Phase 6: 一般推論(飲食)' };
  if (item.includes('PC')) return { debit: '消耗品費', reason: 'Phase 6: 一般推論(PC)' };

  return { debit: '仮払金', reason: 'Phase 7: Fallback(不明)' };
}


// ========================================================================
// 🚀 Composable Implementation
// ========================================================================

const currentUser = reactive({ name: '管理者 太郎', email: 'admin@sugu-suru.com' });
// State
const jobs = ref<Job[]>(MOCK_JOBS);
const clients = ref<Client[]>([]);
const currentJob = ref<Job | null>(null);
const isLoading = ref(false);
const error = ref<string | null>(null);
const adminData = reactive(MOCK_ADMIN_DATA);
const isEmergencyStopped = ref(false);

let unsubscribeJobs: (() => void) | null = null;

export function useAccountingSystem() {
  const { identifyBank, generateAutoMaster } = useBankLogic();

  // --- Actions ---

  async function fetchJobById(jobId: string) {
    isLoading.value = true;
    error.value = null;
    try {
      const job = jobs.value.find(j => j.id === jobId);
      if (job) {
        currentJob.value = job;
      } else {
        // Fallback to Firestore if implemented
        const dbJob = await FirestoreRepository.getJobById(jobId);
        if (dbJob) currentJob.value = dbJob;
        else error.value = "ジョブが見つかりません";
      }
    } catch (e) {
      console.error(e);
      error.value = "ジョブデータの取得に失敗しました";
    } finally {
      isLoading.value = false;
    }
  }

  async function createNewJob(file: File, clientCode: string): Promise<string | null> {
    // Simplified Mock Creation
    const newId = "job_" + Date.now();
    const newJob = createMockJob(newId, new Date().toISOString(), "新規アップロード", "解析中...", 0, 'ai_processing', "未確定");
    newJob.clientCode = clientCode;

    // In real app, we upload to Drive here
    jobs.value.push(newJob);
    return newId;
  }

  async function createClient(data: Partial<Client>) {
    isLoading.value = true;
    try {
      if (!data.clientCode) throw new Error("Client Code is required");
      const newClient: Client = {
        clientCode: data.clientCode,
        companyName: data.companyName || "",
        repName: data.repName || "",
        fiscalMonth: data.fiscalMonth || 3,
        status: (data.status as any) || 'active',
        sharedFolderId: "mock_shared_" + data.clientCode,
        processingFolderId: "mock_proc_" + data.clientCode,
        archivedFolderId: "mock_arch_" + data.clientCode,
        excludedFolderId: "mock_excl_" + data.clientCode,
        csvOutputFolderId: "mock_csv_" + data.clientCode,
        learningCsvFolderId: "mock_learn_" + data.clientCode,
        taxFilingType: data.taxFilingType || 'blue',
        consumptionTaxMode: data.consumptionTaxMode || 'general',
        accountingSoftware: data.accountingSoftware || 'freee',
        driveLinked: false,
        updatedAt: Timestamp.now()
      };
      await FirestoreRepository.addClient(newClient);
      await fetchClients();
    } catch (e: any) {
      error.value = e.message;
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  async function fetchClients() {
    isLoading.value = true;
    try {
      const data = await FirestoreRepository.getAllClients();

      // --- MOCK INJECTION FOR VERIFICATION ---
      // Ensure "Test Shoji" is present for Screen B to render
      if (!data.find(c => c.clientCode === '1001')) {
        data.unshift({
          clientCode: '1001',
          companyName: '株式会社 テスト商事',
          repName: '管理者 太郎',
          fiscalMonth: 3,
          status: 'active',
          sharedFolderId: 'mock_shared_1001',
          processingFolderId: 'mock_proc_1001',
          archivedFolderId: 'mock_arch_1001',
          excludedFolderId: 'mock_excl_1001',
          csvOutputFolderId: 'mock_csv_1001',
          learningCsvFolderId: 'mock_learn_1001',
          taxFilingType: 'blue',
          consumptionTaxMode: 'general',
          accountingSoftware: 'freee',
          driveLinked: true,
          updatedAt: Timestamp.now()
        });
      }

      // RESTORE MOCKS FOR OTHER SCREENS IF MISSING
      if (!data.find(c => c.clientCode === '1002')) {
        data.push({ clientCode: '1002', companyName: 'Mock Client 1002', repName: 'Mock Rep', fiscalMonth: 12, status: 'active', accountingSoftware: 'freee', driveLinked: false } as any);
      }
      if (!data.find(c => c.clientCode === '2001')) {
        data.push({ clientCode: '2001', companyName: '株式会社サンプル商事', repName: 'Sample Rep', fiscalMonth: 9, status: 'active', accountingSoftware: 'yayoi', driveLinked: false } as any);
      }

      clients.value = data;
    } catch (e) {
      console.error(e);
      // Fallback if DB empty/error
      // clients.value = [];
    } finally {
      isLoading.value = false;
    }
  }

  // Material Status Logic (Adapted for new Schema)
  function checkMaterialStatus(client: Client, clientJobs: Job[]) {
    if (!client.expectedMaterials) return [];
    const statusList = client.expectedMaterials.map(matName => {
      const isReceived = clientJobs.some(job => {
        // Simple string match on lines
        return job.lines.some(l => l.description.includes(matName) || l.drSubAccount?.includes(matName));
      });
      return { name: matName, status: isReceived ? 'received' : 'missing' };
    });
    return statusList;
  }

  function subscribeToClientJobs(clientCode: string) {
    // Mock subscription using local state + firestore
    // For now, just filtering local jobs
    // Real implementation w/ FirestoreRepository
    isLoading.value = true;
    if (unsubscribeJobs) unsubscribeJobs();
    unsubscribeJobs = FirestoreRepository.subscribeToJobsByClient(clientCode, (updated) => {
      // Merge logic if needed, or just replace
      // jobs.value = updated;
      isLoading.value = false;
      // jobs.value = updated;
      isLoading.value = false;
    });
  }

  function getClientByCode(code: string): Client | undefined {
    return clients.value.find(c => c.clientCode === code) || { clientCode: code, companyName: 'Mock Client (' + code + ')', driveLinked: false } as any;
  }

  return {
    // State
    clients,
    jobs,
    currentJob,
    currentUser,
    adminData,
    isEmergencyStopped,
    isLoading,
    error,

    // Actions
    fetchJobById,
    createNewJob,
    createClient,
    fetchClients,
    subscribeToClientJobs,
    checkMaterialStatus,
    getClientByCode,

    async updateJobStatus(jobId: string, status: JobStatus, errorMessage?: string) {
      // optimistically update local
      const job = jobs.value.find(j => j.id === jobId);
      if (job) {
        job.status = status;
        job.errorMessage = errorMessage;
        job.updatedAt = Timestamp.now();
      }
      // Call Firestore (Mock or Real)
      await FirestoreRepository.updateJobStatus(jobId, status, errorMessage);
    },

    async updateJob(jobId: string, data: Partial<Job>) {
      // Optimistic Update
      const job = jobs.value.find(j => j.id === jobId);
      if (job) {
        Object.assign(job, data, { updatedAt: Timestamp.now() });
      }
      await FirestoreRepository.updateJob(jobId, data);
    },

    // Helpers
    runAIInference: determineAccountItem,
    toggleEmergencyStop() {
      isEmergencyStopped.value = !isEmergencyStopped.value;
    }
  };
}
