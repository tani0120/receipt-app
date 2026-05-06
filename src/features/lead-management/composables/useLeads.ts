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

export type { Lead, LeadStatus, LeadForm }

/** 空のフォームを生成 */
export const emptyLeadForm = (): LeadForm => ({
  threeCode: '', companyName: '', companyNameKana: '', type: 'corp',
  repName: '', repNameKana: '', phoneNumber: '',
  email: '', chatRoomUrl: '',
  contactType: 'email', contactValue: '',
  fiscalMonth: 3, fiscalDay: '末日', industry: '', establishedDate: '', status: 'active',
  accountingSoftware: 'mf', taxFilingType: 'blue', consumptionTaxMode: 'general',
  taxMethod: 'inclusive', calculationMethod: 'accrual', defaultPaymentMethod: 'cash',
  isInvoiceRegistered: false, invoiceRegistrationNumber: '',
  hasDepartmentManagement: false, hasRentalIncome: false,
  staffId: null, sharedFolderId: '', sharedEmail: '', sharedChatUrl: '',
  advisoryFee: 0, bookkeepingFee: 0, settlementFee: 0, taxFilingFee: 0,
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

const leads = ref<Lead[]>([])
let initialized = false

async function refresh(): Promise<void> {
  try {
    const raw = await apiGet<{ leads: Lead[] } | Lead[]>('')
    const list = Array.isArray(raw) ? raw : raw.leads
    leads.value = list
    initialized = true
    console.log(`[useLeads] ${list.length}件をサーバーから取得`)
  } catch (err) {
    console.error('[useLeads] サーバー取得失敗:', err)
  }
}

async function ensureLoaded(): Promise<void> {
  if (!initialized) {
    await refresh()
  }
}

ensureLoaded()

const lastError = ref<string | null>(null)

export function useLeads() {
  const route = useRoute();

  const currentLead = computed<Lead | null>(() => {
    const paramLeadId = route.params.leadId;
    if (paramLeadId && typeof paramLeadId === 'string') {
      const found = leads.value.find(l => l.leadId === paramLeadId);
      if (found) return found;
    }
    const path = route.path;
    const leadsMatch = path.match(/\/leads\/([^/]+)/);
    if (leadsMatch && leadsMatch[1]) {
      const paramId = leadsMatch[1];
      const found = leads.value.find(l => l.threeCode.toLowerCase() === paramId.toLowerCase() || l.leadId === paramId);
      if (found) return found;
    }
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

  function addLead(lead: Lead): void {
    leads.value.push(lead)
    lastError.value = null
    apiPost('', lead).catch(err => {
      const msg = `見込先追加の保存に失敗しました: ${err}`
      console.error('[useLeads]', msg)
      lastError.value = msg
    })
  }

  function updateLeadLocal(leadId: string, data: Partial<Lead>): void {
    const idx = leads.value.findIndex(l => l.leadId === leadId)
    if (idx >= 0) {
      leads.value[idx] = { ...leads.value[idx]!, ...data, leadId }
    }
    lastError.value = null
    apiPut(`/${leadId}`, data).catch(err => {
      const msg = `見込先更新の保存に失敗しました: ${err}`
      console.error('[useLeads]', msg)
      lastError.value = msg
    })
  }

  return {
    leads,
    currentLead,
    getStaffNameForLead,
    updateSharedFolderId,
    addLead,
    updateLeadLocal,
    refresh,
    lastError,
  };
}

export const createLeadId = (threeCode: string, existingLeads: Lead[]): string => {
  let maxSeq = 0;
  for (const l of existingLeads) {
    const dash = l.leadId.indexOf('-');
    if (dash >= 0) {
      const seq = parseInt(l.leadId.substring(dash + 1), 10);
      if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
    }
  }
  const nextSeq = String(maxSeq + 1).padStart(5, '0');
  return `${threeCode}-${nextSeq}`;
};
