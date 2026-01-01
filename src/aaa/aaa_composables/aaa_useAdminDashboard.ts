import { ref } from 'vue';

// Define strict types for the dashboard data structure (Contract)
export interface StaffPerformance {
  monthlyJournals: number;
  processingTime: string;
  velocityPerHour: number;
}

export interface StaffAnalysis {
  name: string;
  performance: StaffPerformance;
}

export interface DashboardData {
  kpiCostQuality: {
    registeredClients: number;
  };
  kpiProductivity: {
    journals: {
      monthlyAvg: number;
    };
    apiCost: {
      thisMonthForecast: number;
    };
  };
  staffAnalysis: StaffAnalysis[];
  systemLogs: {
    message: string;
    timestamp: string;
    detail: string;
    solution: string;
  }[];
}

// Mock Data (Static for Phase C)
const MOCK_DATA: DashboardData = {
  kpiCostQuality: {
    registeredClients: 124
  },
  kpiProductivity: {
    journals: { monthlyAvg: 8500 },
    apiCost: { thisMonthForecast: 45000 }
  },
  staffAnalysis: [
    { name: '佐藤 健太', performance: { monthlyJournals: 1200, processingTime: '45h', velocityPerHour: 26.6 } },
    { name: '鈴木 美咲', performance: { monthlyJournals: 980, processingTime: '38h', velocityPerHour: 25.7 } },
    { name: '高橋 誠', performance: { monthlyJournals: 1450, processingTime: '52h', velocityPerHour: 27.8 } },
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
  ]
};

export function aaa_useAdminDashboard() {
  const data = ref<DashboardData>(MOCK_DATA);
  return { data };
}
