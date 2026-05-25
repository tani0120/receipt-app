/**
 * useLeads — 見込先管理composable（API接続版）
 *
 * useClients.tsと同一構成。Client→Leadに置換。
 *
 * 準拠: DL-042
 */

import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useStaff } from '@/features/staff-management/composables/useStaff'
import type { Lead, LeadStatus, LeadForm } from '@/repositories/types'
import { UI_MSG } from '@/constants/uiMessages'

export type { Lead, LeadStatus, LeadForm }

/** 空のフォームを生成 */
export const emptyLeadForm = (): LeadForm => ({
  threeCode: '', companyName: '', companyNameKana: '', type: 'corp',
  repName: '', repNameKana: '',
  contactType: 'email', contactValue: '',
  fiscalMonth: 3, fiscalDay: '末日', industry: '', establishedDate: '', status: 'active',
  accountingSoftware: 'mf', taxFilingType: 'blue', consumptionTaxMode: 'individual_allocation',
  taxMethod: 'tax_included', calculationMethod: 'accrual', defaultPaymentMethod: 'cash',
  isInvoiceRegistered: false, invoiceRegistrationNumber: '',
  hasDepartmentManagement: false, hasRentalIncome: false,
  staffId: null, sharedFolderId: '', sharedEmail: '',
  advisoryFee: 0, bookkeepingFee: 0, settlementFee: 0, taxFilingFee: 0,
  // ── Kintone拡張フィールド（Client版と統一） ──
  engagementStartDate: '', engagementEndDate: null,
  subStaffId: null, payrollStaffId: null,
  corporateNumber: '', repTitle: '',
  websiteUrl: '', annualRevenue: '', employeeCount: null,
  businessDescription: '', parentCompany: '', memo: '',
  pastStaffHistory: [], contacts: [],
  // ニーズ管理
  needsInsurance: '', needsTaxSaving: '', needsSubsidy: '', needsLoan: '', needsRealEstate: '',
  // 税務関連
  consumptionTaxInterim: 'none',
  // システム導入状況
  accountingSoftwareMemo: '', payrollSoftware: '', payrollSoftwareMemo: '',
  attendanceSystem: '', attendanceSystemMemo: '', otherSystem: '', otherSystemMemo: '',
  // 報酬情報拡張
  contractScope: '', bookkeepingType: '',
  hasSocialInsuranceContract: 'no', hasPayrollService: 'no', hasAccountingService: 'no',
  socialInsuranceFee: 0, payrollFee: 0, accountingServiceFee: 0, systemFee: 0,
  contractDocUrl: '', paymentMethod: '', paymentDay: '', feeNotes: '',
  attachmentFiles: [],
});

const API_BASE = '/api/leads'

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`)
  if (!res.ok) throw new Error(`API GET ${path} failed: ${res.status}`)
  return res.json()
}

async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`API POST ${path} failed: ${res.status}`)
  return res.json()
}

async function apiPut(path: string, body: unknown): Promise<void> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`API PUT ${path} failed: ${res.status}`)
}

const CACHE_KEY = 'sugu-suru:leads-cache'
const leads = ref<Lead[]>([])
let initialized = false

function loadCache(): void {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    if (raw) {
      const cached = JSON.parse(raw) as Lead[]
      if (Array.isArray(cached) && cached.length > 0) {
        leads.value = cached
        initialized = true
        console.log(`[useLeads] キャッシュから${cached.length}件を即座に表示`)
      }
    }
  } catch { /* 無視 */ }
}

async function refresh(): Promise<void> {
  try {
    const raw = await apiGet<{ leads: Lead[] } | Lead[]>('')
    const list = Array.isArray(raw) ? raw : raw.leads
    leads.value = list
    initialized = true
    console.log(`[useLeads] ${list.length}件をサーバーから取得`)
    try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(list)) } catch { /* 無視 */ }
  } catch (err) {
    console.error('[useLeads] サーバー取得失敗:', err)
  }
}

async function ensureLoaded(): Promise<void> {
  if (!initialized) {
    loadCache()
    await refresh()
  }
}

ensureLoaded()

const lastError = ref<string | null>(null)

export function useLeads() {
  const route = useRoute();

  const currentLead = computed<Lead | null>(() => {
    // 1. route.params.leadId
    const paramLeadId = route.params.leadId;
    if (paramLeadId && typeof paramLeadId === 'string') {
      const found = leads.value.find(l => l.leadId === paramLeadId);
      if (found) return found;
    }
    // 2. /leads/:leadId パターン
    const path = route.path;
    const leadsMatch = path.match(/\/leads\/([^/]+)/);
    if (leadsMatch && leadsMatch[1]) {
      const paramId = leadsMatch[1];
      const found = leads.value.find(l => l.threeCode.toLowerCase() === paramId.toLowerCase() || l.leadId === paramId);
      if (found) return found;
    }
    // 3. クエリパラメータ ?lead=leadId から取得（互換用）
    const leadQuery = route.query.lead;
    if (leadQuery && typeof leadQuery === 'string') {
      const found = leads.value.find(l => l.leadId === leadQuery);
      if (found) return found;
    }
    // 4. 該当なし → null
    return null;
  });

  function getStaffNameForLead(leadId: string): string {
    const lead = leads.value.find(l => l.leadId === leadId)
    if (!lead?.staffId) return ''
    const { getStaffName } = useStaff()
    return getStaffName(lead.staffId)
  }

  function updateSharedFolderId(leadId: string, folderId: string) {
    const idx = leads.value.findIndex(l => l.leadId === leadId)
    if (idx >= 0) {
      leads.value[idx] = { ...leads.value[idx]!, sharedFolderId: folderId }
      apiPut(`/${leadId}/shared-folder`, { folderId })
        .catch(err => console.error('[useLeads] sharedFolderId更新エラー:', err))
    }
  }

  /** 見込先追加（サーバー先行。サーバーがIDを発番して返す） */
  async function addLead(lead: Omit<Lead, 'leadId'> & { leadId?: string }): Promise<Lead> {
    lastError.value = null
    try {
      const res = await apiPost<{ ok: boolean; lead: Lead }>('', lead)
      const saved = res.lead
      leads.value.push(saved)
      return saved
    } catch (err) {
      const msg = `${UI_MSG.見込先追加保存失敗} ${err}`
      console.error('[useLeads]', msg)
      lastError.value = msg
      throw err
    }
  }

  /** 見込先更新（サーバー保存成功 → ref反映） */
  async function updateLeadLocal(leadId: string, data: Partial<Lead>): Promise<void> {
    lastError.value = null
    try {
      await apiPut(`/${leadId}`, data)
      const idx = leads.value.findIndex(l => l.leadId === leadId)
      if (idx >= 0) {
        leads.value[idx] = { ...leads.value[idx]!, ...data, leadId }
      }
    } catch (err) {
      const msg = `${UI_MSG.見込先更新保存失敗} ${err}`
      console.error('[useLeads]', msg)
      lastError.value = msg
      throw err
    }
  }

  /**
   * POST /api/leads/list — サーバー側でフィルタ+ソート+ページネーション
   */
  async function listLeads(query: {
    filters?: { field: string; operator: string; value: string | string[] }[]
    logic?: 'and' | 'or'
    sorts?: { key: string; order: 'asc' | 'desc' }[]
    page?: number
    pageSize?: number
  }): Promise<{ rows: Lead[]; totalCount: number; page: number; pageSize: number; totalPages: number }> {
    return apiPost<{ rows: Lead[]; totalCount: number; page: number; pageSize: number; totalPages: number }>('/list', query)
  }

  return {
    leads,
    currentLead,
    getStaffNameForLead,
    updateSharedFolderId,
    addLead,
    updateLeadLocal,
    listLeads,
    refresh,
    lastError,
  };
}
