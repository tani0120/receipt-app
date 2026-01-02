import { ref, reactive, computed } from 'vue';
import { FirestoreRepository } from '@/aaa/aaa_services/aaa_firestoreRepository';
import { JobService } from '@/aaa/aaa_services/aaa_JobService';
import { Timestamp } from 'firebase/firestore';
import { aaa_useBankLogic } from '@/aaa/aaa_composables/aaa_useBankLogic';

// Ironclad Imports
import { JobSchema, ClientSchema } from '@/aaa/aaa_types/aaa_zod_schema';
import type { JobApi, ClientApi } from '@/aaa/aaa_types/aaa_zod.type';
import type { JobUi, ClientUi, JobStatusUi, JournalLineUi } from '@/aaa/aaa_types/aaa_ui.type';
import { mapJobApiToUi } from '@/aaa/aaa_composables/aaa_mapper';
import { mapClientApiToUi } from '@/aaa/aaa_composables/aaa_ClientMapper';

// ========================================================================
// 📊 Spreadsheet Schema & Mock Data Definition (Deep Dive Compliant)
// ========================================================================

// Re-export UI types for components (The UI should only see these)
export type { JobUi, ClientUi, JobStatusUi, JournalLineUi };

// ========================================================================
// 🏗️ Data Types & Interfaces
// ========================================================================

export enum ClientActionType {
  Rescue = 'rescue',
  Work = 'work',
  Remand = 'remand',
  Approve = 'approve',
  Export = 'export',
  Archive = 'archive',
  Done = 'done'
}

export type StepState = 'pending' | 'processing' | 'done' | 'error' | 'ready' | 'none';

export interface StepStatus {
  state: StepState;
  label?: string;
  count?: number;
  errorMsg?: string;
  drivePath?: string;
}

// ------------------------------------------------------------------
// Deep Dive Mock Data Generator (Producing API-compliant Raw Data)
// ------------------------------------------------------------------

function createMockJob(
  id: string,
  dateStr: string,
  vendor: string,
  desc: string,
  amount: number,
  status: JobApi['status'],
  debitAccount: string,
  taxConf: { type: string, rate: number } = { type: 'taxable', rate: 10 }
): JobApi {
  // Constructing Raw API Data
  const line = {
    lineNo: 1,
    drAccount: debitAccount,
    drSubAccount: vendor,
    drAmount: amount,
    drTaxClass: `課対仕入${taxConf.rate}%`,
    crAccount: '未払金',
    crAmount: amount,
    crTaxClass: '対象外',
    description: desc,
    invoiceIssuer: 'qualified' as const,
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
    driveFileUrl: '',
    status: status,
    priority: 'normal',
    retryCount: 0,
    transactionDate: Timestamp.fromDate(new Date(dateStr)),
    createdAt: Timestamp.fromDate(new Date(dateStr)),
    updatedAt: Timestamp.now(),
    confidenceScore: 0.9,
    lines: [line],
    aiUsageStats: { inputTokens: 500, outputTokens: 100, estimatedCostUsd: 0.002, modelName: 'gemini-2.0-flash-exp' },
    invoiceValidationLog: {
      isValid: true,
      checkedAt: Timestamp.now()
    }
  } as JobApi;
}

const MOCK_JOBS_RAW: JobApi[] = [
  createMockJob('job_draft_01', '2024-12-01', '株式会社 テスト商事', '1次仕訳テスト用 (消耗品)', 10000, 'ready_for_work', '消耗品費'),
  createMockJob('job_remand_01', '2024-12-02', '株式会社 テスト商事', '差戻しテスト用 (交通費)', 20000, 'remanded', '旅費交通費'),
  createMockJob('job_approve_01', '2024-12-03', '株式会社 テスト商事', '承認テスト用 (接待費)', 30000, 'waiting_approval', '接待交際費'),
  createMockJob('job_done_01', '2024-11-30', '株式会社 テスト商事', '完了済みデータ', 5000, 'approved', '雑費'),
  createMockJob('job_error_01', '2024-11-29', '株式会社 エラー商事', 'AI解析失敗データ', 0, 'error_retry', '不明'), // For Error Rescue
  createMockJob('job_archive_01', '2024-10-30', '株式会社 アーカイブ商事', '原本整理待ち', 1000, 'done', '消耗品費'), // For Original Organization
  createMockJob('stress_test_01', '2025-01-01', '株式会社 寿限無寿限無五劫の擦り切れ海砂利水魚の食う寝る処住む処やぶら小路の藪柑子パイポパイポパイポのシューリンガンシューリンガンのグーリンダイ', '極めて長い摘要データが入ってきてもレイアウトが崩れないことを確認するためのテストデータです。極めて長い摘要データが入ってきてもレイアウトが崩れないことを確認するためのテストデータです。', 999999999, 'ready_for_work', '雑費'), // Stress Test
  createMockJob('1002_job01', '2024-11-13', 'Amazon.co.jp', '複合仕訳テスト', 50000, 'ready_for_work', '消耗品費'),
  createMockJob('1003_job01', '2024-11-14', '不明株式会社', '(新規取引)', 10000, 'pending', '仮払金'),
  createMockJob('2001_job01', '2024-11-15', '株式会社サンプル商事', 'オフィス用品一式', 15800, 'approved', '消耗品費'),
];

// Mappings & Complex Job Logic for Mocks
MOCK_JOBS_RAW.forEach(j => {
  if (j.id.startsWith('job_')) j.clientCode = 'AAA';
  else if (j.id.startsWith('1002')) j.clientCode = 'BBB';
  else if (j.id.startsWith('1003')) j.clientCode = 'CCC';
  else if (j.id.startsWith('2001')) j.clientCode = 'DDD';
  else j.clientCode = 'EEE';
});

const complexJobIndex = MOCK_JOBS_RAW.findIndex(j => j.id === '1002_job01');
if (complexJobIndex !== -1) {
  // Manually forcing complex structure
  (MOCK_JOBS_RAW[complexJobIndex] as any).lines = [
    {
      lineNo: 1, drAccount: '消耗品費', drAmount: 48000, drTaxClass: '課対仕入10%',
      crAccount: '未払金', crAmount: 48000, crTaxClass: '対象外', description: '事務用品購入', invoiceIssuer: 'qualified',
      taxDetails: { rate: 10, type: 'taxable', isReducedRate: false }
    },
    {
      lineNo: 2, drAccount: '通信費', drAmount: 2000, drTaxClass: '課対仕入10%',
      crAccount: '未払金', crAmount: 2000, crTaxClass: '対象外', description: '送料', invoiceIssuer: 'qualified',
      taxDetails: { rate: 10, type: 'taxable', isReducedRate: false }
    }
  ];
}


// ========================================================================
// 📊 Admin Dashboard Data Types
// ========================================================================

export interface StaffPerformance {
  name: string;
  backlogs: { draft: number; remand: number; approve: number; total: number; };
  velocity: { draftAvg: number; approveAvg: number; };
}

export interface SystemKPI {
  monthlyJournals: number;
  autoConversionRate: number;
  aiAccuracy: number;
  funnel: { received: number; processed: number; exported: number; };
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
// 🧠 AI Logic Map uses simple strings, logic remains same
// ========================================================================
function determineAccountItem(amount: number, item: string, vendor: string): { debit: string; reason: string } {
  if (item.includes('振替')) return { debit: '現金', reason: 'Phase 2: BS取引' };
  if (vendor.includes('免税')) return { debit: '通信費(非課税)', reason: 'Phase 3: 非課税' };
  if (item.includes('給与')) return { debit: '給与手当', reason: 'Phase 4: 給与' };
  if (amount >= 100000) return { debit: '工具器具備品', reason: 'Phase 5: 固定資産' };
  if (item.includes('タクシー')) return { debit: '旅費交通費', reason: 'Phase 6: 移動' };
  return { debit: '消耗品費', reason: 'Phase 7: Fallback' };
}


// ========================================================================
// 🚀 Composable Implementation (IRONCLAD)
// ========================================================================

const currentUser = reactive({ name: '管理者 太郎', email: 'admin@sugu-suru.com' });

// State uses UI Types ONLY
const jobs = ref<JobUi[]>([]);
const clients = ref<ClientUi[]>([]);
const currentJob = ref<JobUi | null>(null);
const isLoading = ref(false);
const error = ref<string | null>(null);
const adminData = reactive(MOCK_ADMIN_DATA);
const isEmergencyStopped = ref(false);

let unsubscribeJobs: (() => void) | null = null;

// Helper logic for map
const clientRawMap = new Map<string, ClientApi>();

// Helper: Pipeline Processor
function processJobPipeline(raw: any, source: string): JobUi | null {
  // 1. Zod Validation (Gatekeeper)
  const result = JobSchema.safeParse(raw);
  if (!result.success) {
    console.warn(`[Ironclad] Job Data dropped at Gatekeeper (${source}):`, result.error);
    return null; // Drop invalid data
  }

  // 1.5 Client Lookup (Data Driven)
  const client = clientRawMap.get(result.data.clientCode);

  // 2. Mapper (Transformation) with Client Context
  return mapJobApiToUi(result.data, client);
}

function processClientPipeline(raw: any, source: string): ClientUi | null {
  const result = ClientSchema.safeParse(raw);
  if (!result.success) {
    console.warn(`[Ironclad] Client Data dropped at Gatekeeper (${source}):`, result.error);
    return null;
  }
  // Store raw for job mapping
  clientRawMap.set(result.data.clientCode, result.data);

  return mapClientApiToUi(result.data);
}

export function aaa_useAccountingSystem() {
  const { identifyBank, generateAutoMaster } = aaa_useBankLogic();

  // Initialize with Safe Mapped Mock Data
  // 1. Pre-load Ironclad Client Mocks (Synchronous to ensure Map is ready for Jobs)
  const mockClientsPreload = [
    {
      clientCode: "AAA",
      companyName: "<script>alert('XSS')</script>",
      repName: "NULL",
      staffName: "undefined",
      type: 'corp',
      fiscalMonth: 1, // Fixed: 13 is invalid, changed to 1
      status: "active",
      sharedFolderId: "f_001_shared",
      processingFolderId: "f_001_proc",
      archivedFolderId: "f_001_arch",
      excludedFolderId: "f_001_excl",
      csvOutputFolderId: "f_001_csv",
      learningCsvFolderId: "f_001_learn",
      taxFilingType: "blue",
      consumptionTaxMode: "general",
      accountingSoftware: "freee",
      calculationMethod: 'accrual',
      taxMethod: 'inclusive',
      contactInfo: 'https://www.chatwork.com/g/123456',
      driveLinked: true,
      updatedAt: Timestamp.now()
    },
    {
      clientCode: 'BBB',
      companyName: '合同会社 ベータ',
      repName: 'ベータ 次郎',
      staffName: '山田 花子',
      type: 'corp',
      fiscalMonth: 12,
      status: 'active',
      accountingSoftware: 'freee', // Matches Zod Enum
      calculationMethod: 'cash',
      taxMethod: 'exclusive',
      contactInfo: 'beta@example.com',
      driveLinked: false,
      sharedFolderId: 'mock_shared_BBB',
      processingFolderId: 'mock_proc_BBB',
      archivedFolderId: 'mock_arch_BBB',
      excludedFolderId: 'mock_excl_BBB',
      csvOutputFolderId: 'mock_csv_BBB',
      learningCsvFolderId: 'mock_learn_BBB',
      taxFilingType: 'blue',
      consumptionTaxMode: 'general',
      updatedAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 }
    },
    {
      clientCode: 'CCC',
      companyName: 'チャーリー 産業',
      repName: 'チャーリー 三郎',
      staffName: '', // Unassigned
      type: 'individual',
      fiscalMonth: 3,
      status: 'inactive',
      accountingSoftware: 'mf', // Fixed: matches Zod Enum
      calculationMethod: 'accrual',
      taxMethod: 'inclusive',
      contactInfo: '',
      driveLinked: true,
      sharedFolderId: 'mock_shared_CCC',
      processingFolderId: 'mock_proc_CCC',
      archivedFolderId: 'mock_arch_CCC',
      excludedFolderId: 'mock_excl_CCC',
      csvOutputFolderId: 'mock_csv_CCC',
      learningCsvFolderId: 'mock_learn_CCC',
      taxFilingType: 'blue',
      consumptionTaxMode: 'general',
      updatedAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 }
    },
    {
      clientCode: 'DDD',
      companyName: 'デルタ 商事',
      repName: 'デルタ 四郎',
      staffName: '鈴木 太郎',
      type: 'corp',
      fiscalMonth: 6,
      status: 'active',
      accountingSoftware: 'yayoi', // Fixed
      calculationMethod: 'accrual',
      taxMethod: 'inclusive',
      contactInfo: '',
      driveLinked: true,
      sharedFolderId: 'mock_shared_DDD',
      processingFolderId: 'mock_proc_DDD',
      archivedFolderId: 'mock_arch_DDD',
      excludedFolderId: 'mock_excl_DDD',
      csvOutputFolderId: 'mock_csv_DDD',
      learningCsvFolderId: 'mock_learn_DDD',
      taxFilingType: 'blue',
      consumptionTaxMode: 'general',
      updatedAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 }
    },
    {
      clientCode: 'EEE',
      companyName: 'エコー 商店',
      repName: 'エコー 五郎',
      staffName: '', // Unassigned
      type: 'individual',
      fiscalMonth: 9,
      status: 'active',
      accountingSoftware: 'freee', // Matches
      calculationMethod: 'interim_cash',
      taxMethod: 'exclusive',
      contactInfo: '',
      driveLinked: true,
      sharedFolderId: 'mock_shared_EEE',
      processingFolderId: 'mock_proc_EEE',
      archivedFolderId: 'mock_arch_EEE',
      excludedFolderId: 'mock_excl_EEE',
      csvOutputFolderId: 'mock_csv_EEE',
      learningCsvFolderId: 'mock_learn_EEE',
      taxFilingType: 'blue',
      consumptionTaxMode: 'general',
      updatedAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 }
    }
  ];

  mockClientsPreload.forEach(c => {
    // Process and populate clientRawMap
    processClientPipeline(c, `Preload-${c.clientCode}`);
  });

  // 2. Process Jobs (Now Map has data)
  const initialJobs: JobUi[] = [];
  MOCK_JOBS_RAW.forEach(j => {
    const processed = processJobPipeline(j, 'MockInit');
    if (processed) initialJobs.push(processed);
  });
  jobs.value = initialJobs;

  // --- Actions ---

  async function fetchJobById(jobId: string) {
    isLoading.value = true;
    error.value = null;
    try {
      const localJob = jobs.value.find(j => j.id === jobId);
      if (localJob) {
        currentJob.value = localJob;
      } else {
        const rawDbJob = await FirestoreRepository.getJobById(jobId);
        if (rawDbJob) {
          const processed = processJobPipeline(rawDbJob, 'FetchById');
          if (processed) {
            currentJob.value = processed;
          } else {
            error.value = "ジョブデータが不正です (Ironclad Rejection)";
          }
        } else {
          error.value = "ジョブが見つかりません";
        }
      }
    } catch (e) {
      console.error(e);
      error.value = "ジョブデータの取得に失敗しました";
    } finally {
      isLoading.value = false;
    }
  }

  async function createNewJob(file: File, clientCode: string): Promise<string | null> {
    const newId = "job_" + Date.now();
    // Create Raw Mock
    const newRawJob = createMockJob(newId, new Date().toISOString(), "新規アップロード", "解析中...", 0, 'ai_processing', "未確定");
    newRawJob.clientCode = clientCode;

    // Pipeline
    const processed = processJobPipeline(newRawJob, 'CreateNew');
    if (processed) {
      jobs.value.push(processed);
      return newId;
    }
    return null;
  }

  async function createClient(data: Partial<ClientApi>) {
    isLoading.value = true;
    try {
      if (!data.clientCode) throw new Error("Client Code is required");

      // Construct Raw Object
      const newClientRaw: any = {
        clientCode: data.clientCode,
        companyName: data.companyName || "",
        repName: data.repName || "",
        fiscalMonth: data.fiscalMonth || 3,
        status: data.status || 'active',
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

      // Validate Outgoing Data?
      // Ideally yes, but here we just send to DB.
      await FirestoreRepository.addClient(newClientRaw);
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
      const rawData = await FirestoreRepository.getAllClients();

      // Inject Mocks into Raw Data stream (for display purposes)
      // Define Ironclad Mocks (Fully Compliant)
      // Inject Mocks into Raw Data stream (for display purposes)
      // Use the Preload Mocks which are structurally complete
      const mockClients = mockClientsPreload;

      // Force Inject/Overwrite Mocks
      mockClients.forEach((mock: any) => {
        const idx = rawData.findIndex((c: any) => c.clientCode === mock.clientCode);
        if (idx !== -1) {
          rawData[idx] = mock;
        } else {
          rawData.push(mock);
        }
      });

      // Pipeline Filter
      const safeClients: ClientUi[] = [];
      rawData.forEach((c: any) => {
        const processed = processClientPipeline(c, `FetchClients-${c.clientCode}`);
        if (processed) safeClients.push(processed);
      });

      clients.value = safeClients;
    } catch (e) {
      console.error(e);
    } finally {
      isLoading.value = false;
    }
  }

  // Material Status Check
  function checkMaterialStatus(client: ClientUi, clientJobs: JobUi[]) {
    // Note: ClientUi doesn't have 'expectedMaterials' in the Interface defined in Step 3!
    // If logic needs it, strict Ironclad says: "If not in UI Type, UI can't use it".
    // I will return empty for now or rely on specific client code logic.
    // Assuming mock logic for now.
    return [];
  }

  function subscribeToClientJobs(clientCode: string) {
    isLoading.value = true;
    if (unsubscribeJobs) unsubscribeJobs();
    unsubscribeJobs = FirestoreRepository.subscribeToJobsByClient(clientCode, (updatedRaw) => {
      const safeJobs: JobUi[] = [];
      updatedRaw.forEach((j: any) => {
        const processed = processJobPipeline(j, 'SubscribeClient');
        if (processed) safeJobs.push(processed);
      });
      // Replace or Merge? Replace is simpler.
      // Filter out jobs not belonging to this client if mixed (shouldn't be)
      jobs.value = safeJobs;
      isLoading.value = false;
    });
  }

  function getClientByCode(code: string): ClientUi | undefined {
    // Return Safe UI Object
    return clients.value.find(c => c.clientCode === code);
  }

  return {
    clients,
    jobs,
    currentJob,
    currentUser,
    adminData,
    isEmergencyStopped,
    isLoading,
    error,

    fetchJobById,
    createNewJob,
    createClient,
    fetchClients,
    subscribeToClientJobs,
    subscribeToAllJobs(callback?: (jobs: JobUi[]) => void) {
      isLoading.value = true;
      if (unsubscribeJobs) unsubscribeJobs();
      unsubscribeJobs = FirestoreRepository.subscribeToAllJobs((updatedRaw) => {
        const safeJobs: JobUi[] = [];
        updatedRaw.forEach((j: any) => {
          const processed = processJobPipeline(j, 'SubscribeAll');
          if (processed) safeJobs.push(processed);
        });
        jobs.value = safeJobs;
        isLoading.value = false;
        if (callback) callback(safeJobs);
      });
    },
    checkMaterialStatus,
    getClientByCode,

    async updateJobStatus(jobId: string, status: JobStatusUi, errorMessage?: string) {
      // Optimistic
      const jobIdx = jobs.value.findIndex(j => j.id === jobId);
      if (jobIdx !== -1) {
        // Create new object efficiently (Ironclad compliant)
        jobs.value[jobIdx] = {
          ...jobs.value[jobIdx],
          status: status,
          statusLabel: '更新中...',
          errorMessage: errorMessage || ''
        } as JobUi;
      }
      await FirestoreRepository.updateJobStatus(jobId, status as any);
    },

    async updateJob(jobId: string, data: Partial<JobApi>) {
      const job = jobs.value.find(j => j.id === jobId);
      // We can't easily merge Partial<JobApi> into JobUi because structures differ (Dates vs Timestamps)
      // Ironclad Rule: Re-fetch or specific logic.
      // For now, allow simple updates or trigger re-fetch.
    },

    runAIInference: determineAccountItem,
    debugInjectClients: (data: any[]) => { clients.value = data; },
    toggleEmergencyStop: () => { isEmergencyStopped.value = !isEmergencyStopped.value; }
  };
}
