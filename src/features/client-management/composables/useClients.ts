/**
 * useClients — 顧問先管理composable（Piniaストア委譲版）
 *
 * 【設計原則】
 * - 内部はclientStoreに完全委譲
 * - returnインターフェースは変更ゼロ（全ページのimportは一切変更不要）
 * - storeToRefsで状態をref化（Piniaの反応性を維持）
 *
 * 準拠: DL-042, plan_pinia_persistedstate移行.md
 */

import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useClientStore } from '@/stores/clientStore'
import { useStaff } from '@/features/staff-management/composables/useStaff'
import type { Client, ClientStatus, ClientForm } from '@/repositories/types'
import { UI_MSG } from '@/constants/uiMessages'

// re-export（外部から import type { Client } from 'useClients' していた箇所の互換性）
export type { Client, ClientStatus, ClientForm }

// ============================================================
// ヘルパー関数（エクスポート維持）
// ============================================================

/** 空のフォームを生成 */
export const emptyClientForm = (): ClientForm => ({
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
  // ── Kintone拡張フィールド（31_client_management） ──
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
  // 昇格元見込先
  sourceLeadId: null,
});

// ============================================================
// Composable
// ============================================================

export function useClients() {
  const store = useClientStore()
  const { clients, lastError } = storeToRefs(store)
  const route = useRoute();

  /** ルートパスまたはクエリパラメータから現在選択中のクライアントを動的に取得 */
  const currentClient = computed<Client | null>(() => {
    // 1. route.params.clientId（Vue Router定義から自動取得。新ルート追加時の漏れ防止）
    const paramClientId = route.params.clientId;
    if (paramClientId && typeof paramClientId === 'string') {
      const found = clients.value.find(c => c.clientId === paramClientId);
      if (found) return found;
    }
    // 2. /clients/:clientId/settings パターン（旧ページ互換）
    const path = route.path;
    const clientsMatch = path.match(/\/clients\/([^/]+)/);
    if (clientsMatch && clientsMatch[1]) {
      const paramId = clientsMatch[1];
      const found = clients.value.find(c => c.threeCode.toLowerCase() === paramId.toLowerCase() || c.clientId === paramId);
      if (found) return found;
    }
    // 3. クエリパラメータ ?client=clientId から取得（互換用）
    const clientQuery = route.query.client;
    if (clientQuery && typeof clientQuery === 'string') {
      const found = clients.value.find(c => c.clientId === clientQuery);
      if (found) return found;
    }
    // 4. 該当なし → null（マスタページ等ではcurrentClientなし）
    return null;
  });

  /** 顧問先IDから担当者名を取得（Client.staffIdから導出） */
  function getStaffNameForClient(clientId: string): string {
    const client = clients.value.find(c => c.clientId === clientId)
    if (!client?.staffId) return ''
    const { getStaffName } = useStaff()
    return getStaffName(client.staffId)
  }

  /** 顧問先追加（UI_MSGエラーメッセージ互換ラッパー） */
  async function addClient(client: Omit<Client, 'clientId'> & { clientId?: string }): Promise<Client> {
    try {
      return await store.addClient(client)
    } catch (err) {
      // lastErrorは store 側で設定済み。UI_MSGフォーマットに変換
      store.lastError = `${UI_MSG.顧問先追加保存失敗} ${err}`
      throw err
    }
  }

  /** 顧問先更新（UI_MSGエラーメッセージ互換ラッパー） */
  async function updateClientLocal(clientId: string, data: Partial<Client>): Promise<void> {
    try {
      await store.updateClient(clientId, data)
    } catch (err) {
      store.lastError = `${UI_MSG.顧問先更新保存失敗} ${err}`
      throw err
    }
  }

  return {
    clients,
    currentClient,
    getStaffNameForClient,
    updateSharedFolderId: store.updateSharedFolderId,
    addClient,
    updateClientLocal,
    listClients: store.listClients,
    refresh: store.fetchFresh,
    lastError,
  };
}
