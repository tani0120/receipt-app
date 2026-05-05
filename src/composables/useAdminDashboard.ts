import { ref } from 'vue';
import {
  AI_PROMPTS,
  GAS_LOGIC_DEFINITIONS
} from '@/composables/accountingConstants';

// ========================================================================
// 📊 Dashboard Interfaces (Strict Typed Contract)
// ========================================================================

export interface BacklogStatus {
  waiting: number;
  processed: number;
  total: number;
  draft: number;
}

export interface StaffPerformance {
  monthlyJournals: number;
  processingTime: string;
  velocityPerHour: number;
  thisMonthJournals: number;
  monthlyAvgJournals: number;
  annualApiCost: number;
  velocityThisMonth: number;
  velocityAvg: number;
  velocityPerHourAvg: number;
}

export interface StaffAnalysis {
  staffId: string;
  name: string;
  role: string;
  status: string;
  performance: StaffPerformance & { velocity: { draftAvg: number } };
  backlogs: { total: number; draft: number };
  backlog?: Record<string, BacklogStatus>;
}

export interface Staff {
  id: string;
  role: '管理者' | '実務者';
  name: string;
  email: string;
}

export interface ClientAnalysis {
  code: string;
  name: string;
  status: string;
  performance: {
    journalsThisMonth: number;
    journalsThisYear: number;
    journalsLastYear: number;
    apiCostThisYear: number;
    velocityThisMonth: number;
    velocityAvg: number;
  };
}

export interface RuleHistory {
  date: string;
  actor: string;
  action: string;
}

export interface RuleCategory {
  id: string;
  name: string;
  description: string;
  history: RuleHistory[];
}

export interface PromptItem {
  id: string;
  name: string;
  value: string;
}

export interface DashboardData {
  settings: {
    geminiApiKey: string;
    invoiceApiKey: string;
    systemRootId: string;
    masterSsId: string;
    modelName: string;
    systemSettingsSsId: string;
    rulesSsId: string;
    systemDbId: string;
    queueId: string;
    dashboardId: string;
    apiPriceInput: number;
    apiPriceOutput: number;
    exchangeRate: number;
    intervalDispatchMin: number;
    intervalWorkerMin: number;
    intervalLearnerMin: number;
    intervalValidatorMin: number;
    intervalOptimizerDays: number;
    notifyHours: string;
    maxBatchSize: number;
    gasTimeoutLimit: number;
    maxAttemptLimit: number;
    maxOptBatch: number;
    dataRetentionDays: number;
    debugMode: boolean;
    systemStatus: 'ACTIVE' | 'PAUSE' | 'EMERGENCY_STOP';
  };
  apiKeys: {
    geminiApiKey: string;
    invoiceApiKey: string;
  };
  kpi: {
    monthlyJournals: number;
    autoConversionRate: number;
    aiAccuracy: number;
    funnel: {
      received: number;
      exported: number;
    };
    monthlyTrend: number[];
  };
  kpiCostQuality: {
    registeredClients: number;
    activeClients: number;
    stoppedClients: number;
    staffCount: number;
    prevYearEnd?: {
      registeredClients: number;
      activeClients: number;
      stoppedClients: number;
      staffCount: number;
    };
    performance?: {
      monthlyJournals: number;
      processingTime: string;
      velocityPerHour: number;
      timePer100Journals: number;
    };
    performanceYearAvg?: {
      monthlyJournals: number;
      processingTime: string;
      velocityPerHour: number;
      timePer100Journals: number;
    };
  };
  kpiProductivity: {
    journals: {
      thisMonth: number;
      lastMonth: number;
      monthlyAvg: number;
      lastYearSameMonth: number;
      thisYear: number;
      lastYear: number;
    };
    apiCost: {
      thisMonthForecast: number;
      lastMonth: number;
      monthlyAvg: number;
      lastYearSameMonth: number;
      thisYear: number;
      lastYear: number;
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
      totalCalls: number;
    };
  };
  staffList: Staff[];
  performance: {
    staff: {
      name: string;
      backlogs: { total: number; draft: number };
      velocity: { draftAvg: number };
    }[];
  };
  staffAnalysis: StaffAnalysis[];
  clientAnalysis: ClientAnalysis[];
  /** T-31-6: サーバー側で集計済みのステータス別カウント */
  staffStatusCounts: { all: number; active: number; inactive: number; suspension: number };
  clientStatusCounts: { all: number; active: number; inactive: number; suspension: number };
  systemLogs: {
    message: string;
    timestamp: string;
    detail: string;
    solution: string;
  }[];
  prompts: {
    ai: PromptItem[];
    gas: PromptItem[];
  };
  rules: {
    ai: RuleCategory;
    taxYayoi: RuleCategory;
    taxMF: RuleCategory;
    taxFreee: RuleCategory;
    formatYayoi: RuleCategory;
    formatMF: RuleCategory;
    formatFreee: RuleCategory;
  };
}

// ========================================================================
// 📊 デフォルトデータ（API取得前の初期値。ダミー値なし）
// ========================================================================

const DEFAULT_DATA: DashboardData = {
  apiKeys: { geminiApiKey: '', invoiceApiKey: '' },

  settings: {
    geminiApiKey: '',
    invoiceApiKey: '',
    systemRootId: '(入力待)',
    masterSsId: '1XyZ...',

    modelName: 'models/gemini-3.0-flash',
    systemSettingsSsId: '(自動取得)',
    rulesSsId: '(入力待)',
    systemDbId: '(入力待)',
    queueId: '(入力待)', // Only one queueId
    dashboardId: '(入力待)',

    apiPriceInput: 0.50,
    apiPriceOutput: 3.00,
    exchangeRate: 150,

    intervalDispatchMin: 15,
    intervalWorkerMin: 5,
    intervalLearnerMin: 60,
    intervalValidatorMin: 5,
    intervalOptimizerDays: 30,

    notifyHours: '9,12,15,18',
    maxBatchSize: 3,
    gasTimeoutLimit: 270,
    maxAttemptLimit: 3,
    maxOptBatch: 1,
    dataRetentionDays: 30,
    debugMode: false,

    systemStatus: 'ACTIVE'
  },

  kpi: {
    monthlyJournals: 0,
    autoConversionRate: 0,
    aiAccuracy: 0,
    funnel: {
      received: 0,
      exported: 0
    },
    monthlyTrend: []
  },
  performance: {
    staff: []
  },
  kpiCostQuality: {
    registeredClients: 0,
    activeClients: 0,
    stoppedClients: 0,
    staffCount: 0,
    prevYearEnd: undefined,
    performance: undefined,
    performanceYearAvg: undefined,
  },
  kpiProductivity: {
    journals: {
      thisMonth: 0,
      lastMonth: 0,
      monthlyAvg: 0,
      lastYearSameMonth: 0,
      thisYear: 0,
      lastYear: 0
    },
    apiCost: {
      thisMonthForecast: 0,
      lastMonth: 0,
      monthlyAvg: 0,
      lastYearSameMonth: 0,
      thisYear: 0,
      lastYear: 0,
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      totalCalls: 0
    }
  },
  staffList: [],
  staffAnalysis: [],
  clientAnalysis: [],
  staffStatusCounts: { all: 0, active: 0, inactive: 0, suspension: 0 },
  clientStatusCounts: { all: 0, active: 0, inactive: 0, suspension: 0 },
  systemLogs: [],
  prompts: {
    ai: [
      { id: 'P-001', name: 'WORKER: 解析メイン (Phase 1)', value: AI_PROMPTS.WORKER },
      { id: 'P-002', name: 'LEARNER: ルール生成 (Phase 2)', value: AI_PROMPTS.LEARNER },
      { id: 'P-003', name: 'UPDATER: 知識更新 (Phase 3)', value: AI_PROMPTS.UPDATER },
      { id: 'P-004', name: 'BUILDER: 初期知識生成 (Phase 0)', value: AI_PROMPTS.BUILDER },
      { id: 'P-005', name: 'OPTIMIZER: 知識最適化 (Batch)', value: AI_PROMPTS.OPTIMIZER },
      { id: 'P-006', name: 'AUDITOR: 知識監査 (Safety)', value: AI_PROMPTS.AUDITOR }
    ],
    gas: [
      { id: 'G-001', name: 'File Rescue & Dispatch', value: GAS_LOGIC_DEFINITIONS.FILE_RESCUE },
      { id: 'G-002', name: 'Deduplication Logic', value: GAS_LOGIC_DEFINITIONS.DEDUPLICATION },
      { id: 'G-003', name: 'Out of Period Check', value: GAS_LOGIC_DEFINITIONS.OUT_OF_PERIOD },
      { id: 'G-004', name: 'Knowledge Injection', value: GAS_LOGIC_DEFINITIONS.KNOWLEDGE_INJECTION },
      { id: 'G-005', name: 'Tax Validation (1 Yen)', value: GAS_LOGIC_DEFINITIONS.TAX_VALIDATION },
      { id: 'G-006', name: 'System Complement', value: GAS_LOGIC_DEFINITIONS.COMPLEMENT },
      { id: 'G-007', name: 'Image Optimization', value: GAS_LOGIC_DEFINITIONS.IMAGE_OPTIMIZATION },
      { id: 'G-008', name: 'Watchdog & Recovery', value: GAS_LOGIC_DEFINITIONS.WATCHDOG },
      { id: 'G-009', name: 'Tax Code Translation', value: GAS_LOGIC_DEFINITIONS.TAX_TRANSLATION },
      { id: 'G-010', name: 'Inference Logic (New/History)', value: GAS_LOGIC_DEFINITIONS.INFERENCE_LOGIC },
      { id: 'G-011', name: 'Difference Analysis', value: GAS_LOGIC_DEFINITIONS.DIFFERENCE_ANALYSIS },
      { id: 'G-012', name: 'Sandwich Defense', value: GAS_LOGIC_DEFINITIONS.SANDWICH_DEFENSE }
    ]
  },

  rules: {
    ai: {
      id: 'RULE_AI', name: 'AI処理ルール', description: 'AIによる自動仕訳生成の基本ルール設定',
      history: [{ date: '2023-10-01', actor: 'Admin', action: '閾値変更' }]
    },
    taxYayoi: {
      id: 'TAX_YAYOI', name: '税区分 (弥生)', description: '弥生会計形式での税区分変換ルール',
      history: [{ date: '2023-09-15', actor: 'AI', action: '自動更新' }]
    },
    taxMF: {
      id: 'TAX_MF', name: '税区分 (MF)', description: 'マネーフォワード形式での税区分変換ルール',
      history: []
    },
    taxFreee: {
      id: 'TAX_FREEE', name: '税区分 (freee)', description: 'freee形式での税区分変換ルール',
      history: []
    },
    formatYayoi: {
      id: 'FMT_YAYOI', name: '出力形式 (弥生)', description: '弥生インポート形式の列定義',
      history: []
    },
    formatMF: {
      id: 'FMT_MF', name: '出力形式 (MF)', description: 'MFインポート形式の列定義',
      history: []
    },
    formatFreee: {
      id: 'FMT_FREEE', name: '出力形式 (freee)', description: 'freeeインポート形式の列定義',
      history: []
    }
  }
};

export function useAdminDashboard() {
  const data = ref<DashboardData>(DEFAULT_DATA);

  // 実データ取得: サーバー側で集計済みのサマリを1回のAPIで取得（T-31-3）
  async function fetchRealKpi() {
    try {
      const res = await fetch('/api/admin/dashboard/summary');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = await res.json() as {
        kpiCostQuality: {
          registeredClients: number;
          activeClients: number;
          stoppedClients: number;
          staffCount: number;
        };
        clientAnalysis: {
          code: string;
          name: string;
          status: string;
          performance: {
            journalsThisMonth: number;
            journalsThisYear: number;
            journalsLastYear: number;
            apiCostThisYear: number;
            velocityThisMonth: number;
            velocityAvg: number;
          };
        }[];
        staffAnalysis: {
          staffId: string;
          name: string;
          role: string;
          status: string;
          performance: StaffPerformance & { velocity: { draftAvg: number } };
          backlogs: { total: number; draft: number };
          backlog: Record<string, BacklogStatus>;
        }[];
        staffStatusCounts?: { all: number; active: number; inactive: number; suspension: number };
        clientStatusCounts?: { all: number; active: number; inactive: number; suspension: number };
      };

      // サーバーから集計済みデータをそのまま設定（フロント側のfilter/mapは不要）
      data.value.kpiCostQuality.registeredClients = body.kpiCostQuality.registeredClients;
      data.value.kpiCostQuality.activeClients = body.kpiCostQuality.activeClients;
      data.value.kpiCostQuality.stoppedClients = body.kpiCostQuality.stoppedClients;
      data.value.kpiCostQuality.staffCount = body.kpiCostQuality.staffCount;

      if (body.clientAnalysis.length > 0) {
        data.value.clientAnalysis = body.clientAnalysis;
      }
      if (body.staffAnalysis.length > 0) {
        data.value.staffAnalysis = body.staffAnalysis;
      }
      // T-31-6: ステータス別カウントをサーバーから直接設定
      if (body.staffStatusCounts) {
        data.value.staffStatusCounts = body.staffStatusCounts;
      }
      if (body.clientStatusCounts) {
        data.value.clientStatusCounts = body.clientStatusCounts;
      }
    } catch (e) {
      console.warn('[useAdminDashboard] サマリ取得失敗。ダミー値を使用:', e);
    }
  }

  /** 活動ログ集計を取得してスタッフ別・顧問先別に反映 */
  async function fetchActivitySummary() {
    try {
      const res = await fetch('/api/activity-log/summary');
      if (!res.ok) return;
      const body = await res.json() as {
        byStaff: { staffId: string; totalActiveMs: number; sessionCount: number }[];
        byClient: { clientId: string; totalActiveMs: number; sessionCount: number }[];
      };

      // スタッフ別: 処理時間をperformanceに反映
      if (body.byStaff && data.value.staffAnalysis) {
        for (const staffSummary of body.byStaff) {
          const match = data.value.staffAnalysis.find(s => s.staffId === staffSummary.staffId);
          if (match) {
            match.performance.processingTime = `${Math.round(staffSummary.totalActiveMs / 3600000)}h`;
          }
        }
      }

      // 顧問先別: 処理時間をperformanceに反映
      if (body.byClient && data.value.clientAnalysis) {
        for (const clientSummary of body.byClient) {
          const match = data.value.clientAnalysis.find(
            c => c.code === clientSummary.clientId || c.code === clientSummary.clientId.split('-')[0]
          );
          if (match) {
            // 今月処理時間をミリ秒→時間に変換して設定
            const hours = clientSummary.totalActiveMs / 3600000;
            if (hours > 0 && match.performance.journalsThisMonth > 0) {
              match.performance.velocityThisMonth = Math.round(match.performance.journalsThisMonth / hours);
            }
          }
        }
      }
    } catch (e) {
      console.warn('[useAdminDashboard] 活動ログ集計取得失敗:', e);
    }
  }

  /** CSV出力実績を取得して仕訳数に反映 */
  async function fetchCsvSummary() {
    try {
      const res = await fetch('/api/admin/csv-summary');
      if (!res.ok) return;
      type Bucket = { csvLineCount: number; journalCount: number; exportCount: number };
      const body = await res.json() as {
        thisMonth: Bucket;
        monthlyAvg: Bucket;
        lastYearSameMonth: Bucket;
        thisYear: Bucket;
        lastYear: Bucket;
        byClient: { clientId: string; thisMonth: Bucket; thisYear: Bucket; lastYear: Bucket }[];
        byStaff: { staffId: string; thisMonth: Bucket; thisYear: Bucket; lastYear: Bucket }[];
      };

      // 全社指標: 仕訳数を全期間に反映
      data.value.kpiProductivity.journals = {
        thisMonth: body.thisMonth.csvLineCount,
        lastMonth: data.value.kpiProductivity.journals.lastMonth,
        monthlyAvg: body.monthlyAvg.csvLineCount,
        lastYearSameMonth: body.lastYearSameMonth.csvLineCount,
        thisYear: body.thisYear.csvLineCount,
        lastYear: body.lastYear.csvLineCount,
      };

      // 顧問先別: 仕訳数を反映（今月・今年・昨年）
      if (body.byClient && data.value.clientAnalysis) {
        for (const cs of body.byClient) {
          const threeCode = cs.clientId.split('-')[0];
          const match = data.value.clientAnalysis.find(
            c => c.code === cs.clientId || c.code === threeCode
          );
          if (match) {
            match.performance.journalsThisMonth = cs.thisMonth.csvLineCount;
            match.performance.journalsThisYear = cs.thisYear.csvLineCount;
            match.performance.journalsLastYear = cs.lastYear.csvLineCount;
          }
        }
      }

      // スタッフ別: 仕訳数を反映
      if (body.byStaff && data.value.staffAnalysis) {
        for (const ss of body.byStaff) {
          const match = data.value.staffAnalysis.find(s => s.staffId === ss.staffId);
          if (match) {
            match.performance.thisMonthJournals = ss.thisMonth.csvLineCount;
          }
        }
      }

      console.log(`[useAdminDashboard] CSV集計: 今月${body.thisMonth.csvLineCount}, 月平均${body.monthlyAvg.csvLineCount}, 昨年同月${body.lastYearSameMonth.csvLineCount}, 今年${body.thisYear.csvLineCount}, 昨年${body.lastYear.csvLineCount}`);
    } catch (e) {
      console.warn('[useAdminDashboard] CSV集計取得失敗:', e);
    }
  }

  /** AI費用をaiMetrics APIから実データインポート */
  async function fetchAiCostSummary() {
    try {
      const res = await fetch('/api/admin/ai-metrics/summary');
      if (!res.ok) return;
      const body = await res.json() as {
        total: {
          totalCostYen: number;
          totalCalls: number;
          promptTokens: number;
          completionTokens: number;
          totalTokens: number;
        };
        byClient: { key: string; totalCostYen: number }[];
        byStaff: { key: string; totalCostYen: number }[];
      };

      // 全社指標: API費用・トークン数を反映
      data.value.kpiProductivity.apiCost = {
        ...data.value.kpiProductivity.apiCost,
        thisMonthForecast: Math.round(body.total.totalCostYen),
        promptTokens: body.total.promptTokens,
        completionTokens: body.total.completionTokens,
        totalTokens: body.total.totalTokens,
        totalCalls: body.total.totalCalls,
      };

      // 顧問先別: API費用を反映
      if (body.byClient && data.value.clientAnalysis) {
        for (const cs of body.byClient) {
          const threeCode = cs.key.split('-')[0];
          const match = data.value.clientAnalysis.find(
            c => c.code === cs.key || c.code === threeCode
          );
          if (match) {
            match.performance.apiCostThisYear = Math.round(cs.totalCostYen);
          }
        }
      }

      console.log(`[useAdminDashboard] AI費用: ¥${Math.round(body.total.totalCostYen)}, ${body.total.totalCalls}回, ${body.total.totalTokens}トークン`);
    } catch (e) {
      console.warn('[useAdminDashboard] AI費用集計取得失敗:', e);
    }
  }

  fetchRealKpi()
    .then(() => fetchActivitySummary())
    .then(() => fetchCsvSummary())
    .then(() => fetchAiCostSummary());

  const downloadCsv = async () => {
    // TODO: 実際のCSVエクスポートAPIに接続
    console.log('[useAdminDashboard] CSVダウンロード: API未接続');
    return true;
  };

  // Re-export types if needed by components
  return { data, downloadCsv };
}
