/**
 * useClients — 顧問先管理composable（API接続版）
 *
 * 【設計原則】
 * - 型はrepositories/types.tsから一元参照（二重定義禁止）
 * - モジュールスコープrefでキャッシュ（ページ遷移しても保持）
 * - ref即反映 + サーバーfire-and-forget（useDocumentsと同パターン）
 * - CRUDはサーバー側clientStore.tsに委譲
 * - sharedFolderIdのlocalStorage永続化は廃止（サーバーJSON永続化に統一）
 *
 * 準拠: DL-042
 */

import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useStaff } from '@/features/staff-management/composables/useStaff'
import type { Client, ClientStatus, ClientForm } from '@/repositories/types'

// re-export（外部から import type { Client } from 'useClients' していた箇所の互換性）
export type { Client, ClientStatus, ClientForm }

// ============================================================
// ヘルパー関数（エクスポート維持）
// ============================================================

/** 空のフォームを生成 */
export const emptyClientForm = (): ClientForm => ({
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
});

// ============================================================
// API通信ヘルパー
// ============================================================

const API_BASE = '/api/clients'

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

// ============================================================
// モジュールスコープ（シングルトン）
// ============================================================

const clients = ref<Client[]>([])
let initialized = false

/** サーバーから顧問先一覧を取得してrefに設定 */
async function refresh(): Promise<void> {
  try {
    const raw = await apiGet<{ clients: Client[] } | Client[]>('')
    // APIレスポンスが { clients: [...] } か [...] のどちらでも対応
    const list = Array.isArray(raw) ? raw : raw.clients
    clients.value = list
    initialized = true
    console.log(`[useClients] ${list.length}件をサーバーから取得`)

    // DL-042マイグレーション: localStorageのsharedFolderIdをサーバーデータにマージ
    migrateSharedFolderIds()
  } catch (err) {
    console.error('[useClients] サーバー取得失敗:', err)
  }
}

/**
 * localStorageに残っている旧sharedFolderIdをサーバーに移行する。
 * マージ完了後にlocalStorageから削除する。
 */
function migrateSharedFolderIds(): void {
  const raw = localStorage.getItem('sugu-suru:shared-folder-ids')
  if (!raw) return  // 移行済みまたはデータなし

  try {
    const stored = JSON.parse(raw) as Record<string, string>
    let migrated = 0
    for (const [clientId, folderId] of Object.entries(stored)) {
      if (!folderId) continue
      const client = clients.value.find(c => c.clientId === clientId)
      if (client && !client.sharedFolderId) {
        // サーバー側にsharedFolderIdがない場合のみlocalStorageの値をマージ
        client.sharedFolderId = folderId
        apiPut(`/${clientId}/shared-folder`, { folderId })
          .catch(err => console.error(`[useClients] sharedFolderId移行エラー (${clientId}):`, err))
        migrated++
      }
    }
    if (migrated > 0) {
      console.log(`[useClients] ${migrated}件のsharedFolderIdをlocalStorageからサーバーに移行`)
    }
  } catch (err) {
    console.error('[useClients] sharedFolderIdマイグレーションエラー:', err)
  }

  // 移行完了後にlocalStorageから削除（二重移行防止）
  localStorage.removeItem('sugu-suru:shared-folder-ids')
  // 旧staff-assignmentsも不要（Client.staffIdがsource of truth）
  localStorage.removeItem('sugu-suru:staff-assignments')
}

/** 初回のみサーバーから読み込み */
async function ensureLoaded(): Promise<void> {
  if (!initialized) {
    await refresh()
  }
}

// 初回自動読み込み（fire-and-forget）
ensureLoaded()

// ============================================================
// Composable
// ============================================================

/** API通信エラーメッセージ（UIで表示可能） */
const lastError = ref<string | null>(null)

export function useClients() {
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

  /** sharedFolderId（共有フォルダID）を更新（ref即反映 + サーバーfire-and-forget） */
  function updateSharedFolderId(clientId: string, folderId: string) {
    const idx = clients.value.findIndex(c => c.clientId === clientId)
    if (idx >= 0) {
      // ref即反映（computedの再計算をトリガー）
      clients.value[idx] = { ...clients.value[idx]!, sharedFolderId: folderId }
      // サーバーに非同期送信
      apiPut(`/${clientId}/shared-folder`, { folderId })
        .catch(err => console.error('[useClients] sharedFolderId更新エラー:', err))
    }
  }

  /** 顧問先追加（サーバーでID発番 → ref反映） */
  async function addClient(client: Omit<Client, 'clientId'> & { clientId?: string }): Promise<Client> {
    lastError.value = null
    try {
      const res = await apiPost<{ ok: boolean; client: Client }>('', client)
      const saved = res.client
      clients.value.push(saved)
      return saved
    } catch (err) {
      const msg = `顧問先追加の保存に失敗しました: ${err}`
      console.error('[useClients]', msg)
      lastError.value = msg
      throw err
    }
  }

  /** 顧問先更新（サーバー保存成功 → ref反映） */
  async function updateClientLocal(clientId: string, data: Partial<Client>): Promise<void> {
    lastError.value = null
    try {
      await apiPut(`/${clientId}`, data)
      // サーバー成功後にref反映
      const idx = clients.value.findIndex(c => c.clientId === clientId)
      if (idx >= 0) {
        clients.value[idx] = { ...clients.value[idx]!, ...data, clientId }
      }
    } catch (err) {
      const msg = `顧問先更新の保存に失敗しました: ${err}`
      console.error('[useClients]', msg)
      lastError.value = msg
      throw err
    }
  }

  return {
    clients,
    currentClient,
    getStaffNameForClient,
    updateSharedFolderId,
    addClient,
    updateClientLocal,
    refresh,
    lastError,
  };
}
