/**
 * useLeads — 見込先管理composable（Piniaストア委譲版）
 *
 * 内部はleadStoreに完全委譲。returnインターフェース変更ゼロ。
 *
 * 準拠: DL-042, plan_pinia_persistedstate移行.md
 */

import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useLeadStore } from '@/stores/leadStore'
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

export function useLeads() {
  const store = useLeadStore()
  const { leads, lastError } = storeToRefs(store)
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
    const leadQuery = route.query.lead;
    if (leadQuery && typeof leadQuery === 'string') {
      const found = leads.value.find(l => l.leadId === leadQuery);
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

  async function addLead(lead: Omit<Lead, 'leadId'> & { leadId?: string }): Promise<Lead> {
    try {
      return await store.addLead(lead)
    } catch (err) {
      store.lastError = `${UI_MSG.見込先追加保存失敗} ${err}`
      throw err
    }
  }

  async function updateLeadLocal(leadId: string, data: Partial<Lead>): Promise<void> {
    try {
      await store.updateLead(leadId, data)
    } catch (err) {
      store.lastError = `${UI_MSG.見込先更新保存失敗} ${err}`
      throw err
    }
  }

  return {
    leads,
    currentLead,
    getStaffNameForLead,
    updateSharedFolderId: store.updateSharedFolderId,
    addLead,
    updateLeadLocal,
    listLeads: store.listLeads,
    refresh: store.fetchFresh,
    lastError,
  };
}
