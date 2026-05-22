/**
 * useAccountMaster — 勘定科目マスタ composable（API接続版）
 *
 * 【設計原則】useClients.tsパターン準拠
 * - サーバーAPI（/api/accounts/master）から全件取得
 * - sessionStorageキャッシュで楽観的UI（即座に表示）
 * - モジュールスコープのシングルトンrefでフロント側キャッシュ
 * - 変更操作時にサーバーへ自動保存（デバウンス300ms）
 *
 * 準拠: DL-042, Phase 3（ハードコード廃止）
 */
import { ref, computed } from 'vue'
import type { Account } from '@/types/shared-account'

// =============================================
// 型定義
// =============================================

/** マスタレベルの科目拡張（非表示フラグ＋カスタム識別） */
export interface MasterAccount extends Account {
  /** 事務所マスタで非表示に設定されているか */
  hiddenInMaster: boolean
  /** カスタム科目か（事務所で追加した科目） */
  isCustom: boolean
}

// =============================================
// API通信ヘルパー
// =============================================

const API_BASE = '/api/accounts'

// =============================================
// モジュールスコープ（シングルトン）
// =============================================

const CACHE_KEY = 'sugu-suru:account-master-cache'
const allAccounts = ref<Account[]>([])
let initialized = false
let saveTimer: ReturnType<typeof setTimeout> | null = null

/** sessionStorageからキャッシュを即座にrefに設定（楽観的UI） */
function loadCache(): void {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    if (raw) {
      const cached = JSON.parse(raw) as Account[]
      if (Array.isArray(cached) && cached.length > 0) {
        allAccounts.value = cached
        initialized = true
        console.log(`[useAccountMaster] キャッシュから${cached.length}件を即座に表示`)
      }
    }
  } catch { /* キャッシュ破損時は無視 */ }
}

/** サーバーから科目マスタを取得してrefに設定 */
async function refresh(): Promise<void> {
  try {
    const res = await fetch(`${API_BASE}/master?pageSize=200`)
    if (!res.ok) return
    const data = await res.json() as { items: Account[] }
    allAccounts.value = data.items
    initialized = true
    console.log(`[useAccountMaster] ${data.items.length}件をサーバーから取得`)
    try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(data.items)) } catch { /* 容量超過時は無視 */ }
  } catch (err) {
    console.error('[useAccountMaster] サーバー取得失敗:', err)
  }
}

/** 変更をサーバーに保存（デバウンス300ms） */
function debounceSave(): void {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    fetch(`${API_BASE}/master`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accounts: allAccounts.value }),
    }).catch(err => console.error('[useAccountMaster] サーバー保存失敗:', err))
    try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(allAccounts.value)) } catch { /* 無視 */ }
  }, 300)
}

/** 初回のみサーバーから読み込み */
async function ensureLoaded(): Promise<void> {
  if (!initialized) {
    loadCache()
    await refresh()
  }
}

// 初回自動読み込み（fire-and-forget）
ensureLoaded()

/** デフォルト科目 ＋ カスタム科目を統合した全科目リスト */
const masterAccounts = computed<MasterAccount[]>(() => {
  return allAccounts.value
    .map(a => ({
      ...a,
      hiddenInMaster: a.deprecated === true,
      isCustom: (a as MasterAccount).isCustom ?? false,
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder)
})

/** 表示中の科目のみ（非表示を除外） */
const visibleMasterAccounts = computed<MasterAccount[]>(() =>
  masterAccounts.value.filter(a => !a.hiddenInMaster)
)

/** 非表示科目IDの一覧（overrides互換） */
const overrides = computed(() => ({
  hiddenIds: allAccounts.value.filter(a => a.deprecated).map(a => a.id),
  customAccounts: allAccounts.value.filter(a => (a as MasterAccount).isCustom),
}))

// =============================================
// Composable
// =============================================

export function useAccountMaster() {
  /** 科目の表示/非表示をトグル */
  function toggleVisibility(accountId: string): void {
    const idx = allAccounts.value.findIndex(a => a.id === accountId)
    if (idx >= 0) {
      const current = allAccounts.value[idx]!
      allAccounts.value[idx] = { ...current, deprecated: !current.deprecated }
      debounceSave()
    }
  }

  /** カスタム科目を追加 */
  function addCustomAccount(account: Account): void {
    allAccounts.value.push({ ...account, isCustom: true } as Account)
    debounceSave()
  }

  /** カスタム科目を削除（デフォルト科目は削除不可） */
  function removeCustomAccount(accountId: string): boolean {
    const idx = allAccounts.value.findIndex(a => a.id === accountId && (a as MasterAccount).isCustom)
    if (idx < 0) return false
    allAccounts.value.splice(idx, 1)
    debounceSave()
    return true
  }

  /** デフォルト設定にリセット */
  function resetToDefault(): void {
    // カスタム科目を削除、全科目のdeprecatedをfalseに
    allAccounts.value = allAccounts.value
      .filter(a => !(a as MasterAccount).isCustom)
      .map(a => ({ ...a, deprecated: false }))
    debounceSave()
  }

  /** 科目が非表示かどうか */
  function isHidden(accountId: string): boolean {
    return allAccounts.value.find(a => a.id === accountId)?.deprecated === true
  }

  return {
    /** 全科目（非表示含む） */
    masterAccounts,
    /** 表示中の科目のみ */
    visibleMasterAccounts,
    /** 現在の差分データ（顧問先コピー用。overrides互換） */
    overrides,
    /** 生データ（API直接取得結果） */
    allAccounts,
    toggleVisibility,
    addCustomAccount,
    removeCustomAccount,
    resetToDefault,
    isHidden,
  }
}
