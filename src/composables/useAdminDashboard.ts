import { ref } from 'vue';
import {
  AI_PROMPTS,
  GAS_LOGIC_DEFINITIONS
} from '@/composables/useAccountingSystem';

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
  name: string;
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
// 📊 Mock Data
// ========================================================================

const MOCK_DATA: DashboardData = {
  apiKeys: { geminiApiKey: '', invoiceApiKey: '' },

  settings: {
    geminiApiKey: '',
    invoiceApiKey: '',
    systemRootId: '1ZWiIS73fPVaS5MrxI0-9lw_RTj43wZyG',
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
    monthlyJournals: 18542,
    autoConversionRate: 98.2,
    aiAccuracy: 99.8,
    funnel: {
      received: 156,
      exported: 137
    },
    monthlyTrend: [12000, 15000, 18542]
  },
  performance: {
    staff: [
      {
        name: "鈴木 一郎",
        backlogs: { total: 12, draft: 8 },
        velocity: { draftAvg: 45 }
      },
      {
        name: "佐藤 次郎",
        backlogs: { total: 5, draft: 2 },
        velocity: { draftAvg: 41 }
      }
    ]
  },
  kpiCostQuality: {
    registeredClients: 0,
    activeClients: 0,
    stoppedClients: 0,
    staffCount: 0,
    prevYearEnd: undefined,
    performance: {
      monthlyJournals: 12450,
      processingTime: "450h",
      velocityPerHour: 27.6,
      timePer100Journals: 217
    },
    performanceYearAvg: {
      monthlyJournals: 11800,
      processingTime: "440h",
      velocityPerHour: 26.8,
      timePer100Journals: 224
    }
  },
  kpiProductivity: {
    journals: {
      thisMonth: 1250,
      lastMonth: 1180,
      monthlyAvg: 1150,
      lastYearSameMonth: 980,
      thisYear: 14500,
      lastYear: 13200
    },
    apiCost: {
      thisMonthForecast: 45000,
      lastMonth: 42000,
      monthlyAvg: 41000,
      lastYearSameMonth: 35000,
      thisYear: 520000,
      lastYear: 480000
    }
  },
  staffList: [
    { id: 'S001', role: '管理者', name: '管理者 太郎', email: 'admin@example.com' },
    { id: 'S002', role: '実務者', name: '佐藤 健太', email: 'k.sato@example.com' },
    { id: 'S003', role: '実務者', name: '鈴木 美咲', email: 'm.suzuki@example.com' },
    { id: 'S004', role: '実務者', name: '高橋 誠', email: 'm.takahashi@example.com' },
  ],
  staffAnalysis: [
    {
      name: '佐藤 健太',
      performance: {
        monthlyJournals: 1200, processingTime: '45h', velocityPerHour: 26.6,
        thisMonthJournals: 125, monthlyAvgJournals: 110, annualApiCost: 54000,
        velocityThisMonth: 28, velocityAvg: 25, velocityPerHourAvg: 26.6,
        velocity: { draftAvg: 41 }
      },
      backlogs: { total: 5, draft: 2 },
      backlog: {
        '未処理': { waiting: 5, processed: 120, total: 125, draft: 5 },
        'AI処理中': { waiting: 2, processed: 118, total: 120, draft: 2 },
        '確認待ち': { waiting: 8, processed: 100, total: 108, draft: 8 },
        '完了': { waiting: 0, processed: 98, total: 98, draft: 0 },
      }
    },
    {
      name: '鈴木 美咲',
      performance: {
        monthlyJournals: 980, processingTime: '38h', velocityPerHour: 25.7,
        thisMonthJournals: 95, monthlyAvgJournals: 90, annualApiCost: 45000,
        velocityThisMonth: 26, velocityAvg: 24, velocityPerHourAvg: 25.7,
        velocity: { draftAvg: 41 }
      },
      backlogs: { total: 5, draft: 2 },
      backlog: {
        '未処理': { waiting: 0, processed: 95, total: 95, draft: 0 },
        'AI処理中': { waiting: 0, processed: 95, total: 95, draft: 0 },
        '確認待ち': { waiting: 3, processed: 90, total: 93, draft: 3 },
        '完了': { waiting: 0, processed: 90, total: 90, draft: 0 },
      }
    },
    {
      name: '高橋 誠',
      performance: {
        monthlyJournals: 1450, processingTime: '52h', velocityPerHour: 27.8,
        thisMonthJournals: 150, monthlyAvgJournals: 140, annualApiCost: 70000,
        velocityThisMonth: 30, velocityAvg: 28, velocityPerHourAvg: 27.8,
        velocity: { draftAvg: 41 }
      },
      backlogs: { total: 5, draft: 2 },
      backlog: {
        '未処理': { waiting: 12, processed: 140, total: 152, draft: 12 },
        'AI処理中': { waiting: 5, processed: 135, total: 140, draft: 5 },
        '確認待ち': { waiting: 15, processed: 110, total: 125, draft: 15 },
        '完了': { waiting: 0, processed: 100, total: 100, draft: 0 },
      }
    },
  ],
  clientAnalysis: [
    {
      code: 'AAA', name: '株式会社 ＡＡＡ',
      performance: {
        journalsThisMonth: 50, journalsThisYear: 600, journalsLastYear: 550,
        apiCostThisYear: 24000, velocityThisMonth: 25, velocityAvg: 24
      }
    },
    {
      code: 'BBB', name: '合同会社 ＢＢＢ',
      performance: {
        journalsThisMonth: 30, journalsThisYear: 360, journalsLastYear: 300,
        apiCostThisYear: 15000, velocityThisMonth: 22, velocityAvg: 20
      }
    },
    {
      code: 'CCC', name: 'ＣＣＣ 商店',
      performance: {
        journalsThisMonth: 80, journalsThisYear: 960, journalsLastYear: 800,
        apiCostThisYear: 40000, velocityThisMonth: 28, velocityAvg: 26
      }
    }
  ],
  systemLogs: [
    {
      message: 'API Rate Limit Warning',
      timestamp: '2023-10-25 14:30',
      detail: 'Freee API connection unstable.',
      solution: 'Retry connection in 5 mins.'
    },
    {
      message: 'Data Sync Partial Failure',
      timestamp: '2023-10-24 09:15',
      detail: 'Client A sync interrupted.',
      solution: 'Manual sync required for Client A.'
    }
  ],
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

export function aaa_useAdminDashboard() {
  const data = ref<DashboardData>(MOCK_DATA);

  // 実データ取得: 顧問先数・スタッフ数・スタッフ名・顧問先名
  async function fetchRealKpi() {
    try {
      // 顧問先一覧取得（レスポンス: { clients: [...], count: N }）
      const clientRes = await fetch('/api/clients');
      if (clientRes.ok) {
        const body = await clientRes.json() as {
          clients: { clientId: string; threeCode: string; companyName: string; status: string }[];
          count: number;
        };
        const clients = body.clients;
        const active = clients.filter(c => c.status === 'active').length;
        const stopped = clients.filter(c => c.status !== 'active').length;
        data.value.kpiCostQuality.registeredClients = clients.length;
        data.value.kpiCostQuality.activeClients = active;
        data.value.kpiCostQuality.stoppedClients = stopped;

        // 顧問先別指標にインポート（実名・コードを反映）
        if (clients.length > 0) {
          const defaultPerf = {
            journalsThisMonth: 0, journalsThisYear: 0, journalsLastYear: 0,
            apiCostThisYear: 0, velocityThisMonth: 0, velocityAvg: 0
          };
          data.value.clientAnalysis = clients.map(c => ({
            code: c.threeCode || c.clientId,
            name: c.companyName,
            performance: { ...defaultPerf }
          }));
        }
      }
      // スタッフ一覧取得（レスポンス: { staff: [...], count: N }）
      const staffRes = await fetch('/api/staff');
      if (staffRes.ok) {
        const body = await staffRes.json() as {
          staff: { uuid: string; name: string; status: string; role?: string }[];
          count: number;
        };
        const activeStaff = body.staff.filter(s => s.status === 'active').length;
        data.value.kpiCostQuality.staffCount = activeStaff;

        // スタッフ別指標にインポート（実名を反映）
        const activeList = body.staff.filter(s => s.status === 'active');
        if (activeList.length > 0) {
          const defaultPerf = {
            monthlyJournals: 0, processingTime: '0h', velocityPerHour: 0,
            thisMonthJournals: 0, monthlyAvgJournals: 0, annualApiCost: 0,
            velocityThisMonth: 0, velocityAvg: 0, velocityPerHourAvg: 0,
            velocity: { draftAvg: 0 }
          };
          data.value.staffAnalysis = activeList.map(s => ({
            name: s.name,
            performance: { ...defaultPerf },
            backlogs: { total: 0, draft: 0 },
            backlog: {}
          }));
        }
      }
    } catch (e) {
      console.warn('[useAdminDashboard] 実データ取得失敗。ダミー値を使用:', e);
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
        for (const _staffSummary of body.byStaff) {
          // staffIdからスタッフ名を逆引き（staffAnalysisにstaffIdがないためスキップ）
          // TODO: staffAnalysisにstaffIdフィールドを追加してマッチングする
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

  /** CSV行数集計を取得して仕訳数に反映 */
  async function fetchCsvSummary() {
    try {
      const res = await fetch('/api/admin/csv-summary');
      if (!res.ok) return;
      const body = await res.json() as {
        total: { csvLineCount: number; journalCount: number; exportCount: number };
        byClient: { clientId: string; csvLineCount: number; journalCount: number }[];
        byStaff: { staffId: string; csvLineCount: number; journalCount: number }[];
      };

      // 全社指標: 今月の仕訳数（CSV行数）を反映
      if (body.total.csvLineCount > 0) {
        data.value.kpiProductivity.journals = {
          ...data.value.kpiProductivity.journals,
          thisMonth: body.total.csvLineCount,
        };
      }

      // 顧問先別: 今月仕訳数を反映
      if (body.byClient && data.value.clientAnalysis) {
        for (const cs of body.byClient) {
          const match = data.value.clientAnalysis.find(c => c.code === cs.clientId);
          if (match) {
            match.performance.journalsThisMonth = cs.csvLineCount;
          }
        }
      }
    } catch (e) {
      console.warn('[useAdminDashboard] CSV集計取得失敗:', e);
    }
  }

  fetchRealKpi().then(() => fetchActivitySummary()).then(() => fetchCsvSummary());

  const downloadCsv = async () => {
    // Mock CSV Download
    return new Promise<boolean>((resolve) => {
      setTimeout(() => {
        console.log("CSV Downloaded");
        resolve(true);
      }, 1000);
    });
  };

  // Re-export types if needed by components
  return { data, downloadCsv };
}
