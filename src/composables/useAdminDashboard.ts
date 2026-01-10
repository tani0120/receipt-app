import { ref } from 'vue';
import { AI_PROMPTS, GAS_LOGIC_DEFINITIONS } from '@/constants/system_constants';

export interface DashboardData {
  settings: any;
  apiKeys: any;
  kpi: any;
  kpiCostQuality: any;
  kpiProductivity: any;
  staffList: any[];
  staffAnalysis: any[];
  clientAnalysis: any[];
  systemLogs: any[];
  prompts: any;
  rules: any;
  performance: any;
}

const MOCK_DATA: DashboardData = {
  // ... (Full mock data structure omitted for brevity, please infer strict types or use generic mock)
  settings: { aiPhases: { ocr: {}, learning: {}, conversion: {}, optimization: {} } },
  apiKeys: { geminiApiKey: '', invoiceApiKey: '' },
  kpi: { monthlyJournals: 0, autoConversionRate: 0, aiAccuracy: 0, funnel: { received: 0, exported: 0 }, monthlyTrend: [] },
  kpiCostQuality: { registeredClients: 0, activeClients: 0, stoppedClients: 0, staffCount: 0 },
  kpiProductivity: { journals: { thisMonth: 0, lastMonth: 0, monthlyAvg: 0, lastYearSameMonth: 0, thisYear: 0, lastYear: 0 }, apiCost: { thisMonthForecast: 0, lastMonth: 0, monthlyAvg: 0, lastYearSameMonth: 0, thisYear: 0, lastYear: 0 } },
  staffList: [],
  staffAnalysis: [],
  clientAnalysis: [],
  systemLogs: [],
  prompts: { ai: [], gas: [] },
  rules: { ai: {}, taxYayoi: {}, taxMF: {}, taxFreee: {}, formatYayoi: {}, formatMF: {}, formatFreee: {} },
  performance: { staff: [] }
};

export function useAdminDashboard() {
  const data = ref<DashboardData>(MOCK_DATA);
  const downloadCsv = async () => new Promise<boolean>((resolve) => setTimeout(() => resolve(true), 1000));
  const fetchSettings = async () => { };
  const saveAiSettings = async () => true;
  return { data, downloadCsv, fetchSettings, saveAiSettings };
}
