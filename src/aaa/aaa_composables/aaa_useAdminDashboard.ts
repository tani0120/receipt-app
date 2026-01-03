import { ref } from 'vue';

// Define strict types for the dashboard data structure (Contract)
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
  thisMonthJournals?: number;
  monthlyAvgJournals?: number;
  annualApiCost?: number;
  velocityThisMonth?: number;
  velocityAvg?: number;
  velocityPerHourAvg?: number;
}

export interface StaffAnalysis {
  name: string;
  performance: StaffPerformance & { velocity: { draftAvg: number } };
  backlogs: { total: number; draft: number }; // Simplified for Mirror Spec match
  // Keeping extended properties optional for backward compatibility if needed
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
  staffName: string;
  performance: {
    journalsThisMonth: number;
    journalsThisYear: number;
    journalsLastYear: number;
    apiCostThisYear: number;
    velocityThisMonth: number;
    velocityAvg: number;
  };
}

export interface DashboardData {
  // Detailed System Config (22 items from User Request)
  settings: {
    // API & Roots
    geminiApiKey: string; // GEMINI_API_KEY
    invoiceApiKey: string; // 国税局アプリケーションID
    systemRootId: string; // SYSTEM_ROOT_ID
    masterSsId: string; // MASTER_SS_ID

    // Environment
    modelName: string; // 使用モデル名
    systemSettingsSsId: string; // システム設定SS ID
    rulesSsId: string; // 統一ルールSS ID
    systemDbId: string; // システムDB ID
    queueId: string; // 処理待ちキューID
    dashboardId: string; // 改善ダッシュボードID

    // Price & Cost (USD/1M Tokens)
    apiPriceInput: number; // 入力単価($/1M)
    apiPriceOutput: number; // 出力単価($/1M)
    exchangeRate: number; // 為替レート(円/ドル)

    // Scheduler Intervals (Minutes/Days)
    intervalDispatchMin: number; // ジョブ登録間隔(分)
    intervalWorkerMin: number; // ジョブ実行間隔(分)
    intervalLearnerMin: number; // 学習処理間隔(分)
    intervalValidatorMin: number; // 最終確認整形間隔(分)
    intervalOptimizerDays: number; // 知識最適化間隔(日)

    // Config & Limits
    notifyHours: string; // 完了通知時刻
    maxBatchSize: number; // 最大処理件数/1回
    gasTimeoutLimit: number; // タイムアウト秒
    maxAttemptLimit: number; // 最大リトライ回数
    maxOptBatch: number; // 最適化処理数/1回
    dataRetentionDays: number; // データ保存期間(日)
    debugMode: boolean; // デバッグモード

    // System Status (Keep for logic)
    systemStatus: 'ACTIVE' | 'PAUSE' | 'EMERGENCY_STOP';
  };

  apiKeys: {
    // Keep for backward compatibility or remove if fully migrated to settings
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
    ai: { id: string; name: string; value: string }[];
    gas: { id: string; name: string; value: string }[];
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


// Mock Data (Updated to User Request Spec)
const MOCK_DATA: DashboardData = {
  apiKeys: { geminiApiKey: '', invoiceApiKey: '' }, // Legacy ref

  settings: {
    geminiApiKey: '',
    invoiceApiKey: '',
    systemRootId: '1ZWiIS73fPVaS5MrxI0-9lw_RTj43wZyG',
    masterSsId: '1XyZ...',

    modelName: 'models/gemini-3.0-flash',
    systemSettingsSsId: '(自動取得)',
    rulesSsId: '(入力待)',
    systemDbId: '(入力待)',
    queueId: '(入力待)',
    queueId: '(入力待)',
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
    registeredClients: 124,
    activeClients: 110,
    stoppedClients: 14,
    staffCount: 8,
    prevYearEnd: {
      registeredClients: 115,
      activeClients: 100,
      stoppedClients: 15,
      staffCount: 7
    },
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
    { id: 'S001', role: '管理者', name: '管理者 太郎', email: 'admin@sugu-suru.com' },
    { id: 'S002', role: '実務者', name: '佐藤 健太', email: 'k.sato@sugu-suru.com' },
    { id: 'S003', role: '実務者', name: '鈴木 美咲', email: 'm.suzuki@sugu-suru.com' },
    { id: 'S004', role: '実務者', name: '高橋 誠', email: 'm.takahashi@sugu-suru.com' },
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
      code: 'AAA', name: '株式会社 ＡＡＡ', staffName: '佐藤 健太',
      performance: {
        journalsThisMonth: 50, journalsThisYear: 600, journalsLastYear: 550,
        apiCostThisYear: 24000, velocityThisMonth: 25, velocityAvg: 24
      }
    },
    {
      code: 'BBB', name: '合同会社 ＢＢＢ', staffName: '鈴木 美咲',
      performance: {
        journalsThisMonth: 30, journalsThisYear: 360, journalsLastYear: 300,
        apiCostThisYear: 15000, velocityThisMonth: 22, velocityAvg: 20
      }
    },
    {
      code: 'CCC', name: 'ＣＣＣ 商店', staffName: '高橋 誠',
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
      { id: 'P-001', name: '一般仕訳生成', value: '以下の取引内容から勘定科目を推論し、適切な仕訳を出力してください。\n\n[税区分スキーマ]\n${TAX_SCHEMA_TEXT}\n\n[出力形式]\n..."' },
      { id: 'P-002', name: '異常値検知', value: '過去の取引履歴と比較し、金額が異常な取引を検知してください。\n\n参照ルール:\n${TAX_SCHEMA_TEXT}' }
    ],
    gas: [
      { id: 'G-001', name: 'Drive連携', value: '指定フォルダのファイルを検知し...' }
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

export type { RuleCategory, PromptItem } from '@/aaa/aaa_views/aaa_ScreenZ_AdminSettings.vue'; // This might be circular, better define here or ignore for now.
// Defining types here to avoid circular dependency if possible or just use any for now to unblock.
export interface RuleCategory { id: string; name: string; description: string; }
export interface PromptItem { id: string; name: string; value: string; }
