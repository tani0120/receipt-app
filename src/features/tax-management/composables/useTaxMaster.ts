/**
 * useTaxMaster — 税区分マスタ composable（API接続版）
 *
 * 【設計原則】useClients.tsパターン準拠
 * - サーバーAPI（/api/tax-categories/master）から全件取得
 * - sessionStorageキャッシュで楽観的UI（即座に表示）
 * - モジュールスコープのシングルトンrefでフロント側キャッシュ
 * - 変更操作時にサーバーへ自動保存（デバウンス300ms）
 *
 * 準拠: DL-042, Phase 3（ハードコード廃止）
 */
import { ref, computed } from 'vue'
import type { TaxCategory } from '@/types/shared-tax-category'

// =============================================
// 型定義
// =============================================

/** マスタレベルの税区分拡張 */
export interface MasterTaxCategory extends TaxCategory {
  /** 事務所マスタで非表示に設定されているか */
  hiddenInMaster: boolean
}

// =============================================
// API通信ヘルパー
// =============================================

const API_BASE = '/api/tax-categories'

// =============================================
// モジュールスコープ（シングルトン）
// =============================================

const CACHE_KEY = 'sugu-suru:tax-master-cache'
const allTaxCategories = ref<TaxCategory[]>([])
let initialized = false
let saveTimer: ReturnType<typeof setTimeout> | null = null

/** sessionStorageからキャッシュを即座にrefに設定（楽観的UI） */
function loadCache(): void {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    if (raw) {
      const cached = JSON.parse(raw) as TaxCategory[]
      if (Array.isArray(cached) && cached.length > 0) {
        allTaxCategories.value = cached
        initialized = true
        console.log(`[useTaxMaster] キャッシュから${cached.length}件を即座に表示`)
      }
    }
  } catch { /* キャッシュ破損時は無視 */ }
}

/** サーバーから税区分マスタを取得してrefに設定 */
async function refresh(): Promise<void> {
  try {
    const res = await fetch(`${API_BASE}/master?pageSize=200`)
    if (!res.ok) return
    const data = await res.json() as { items: TaxCategory[] }
    allTaxCategories.value = data.items
    initialized = true
    console.log(`[useTaxMaster] ${data.items.length}件をサーバーから取得`)
    try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(data.items)) } catch { /* 容量超過時は無視 */ }
  } catch (err) {
    console.error('[useTaxMaster] サーバー取得失敗:', err)
  }
}

/** 変更をサーバーに保存（デバウンス300ms） */
function debounceSave(): void {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    fetch(`${API_BASE}/master`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taxCategories: allTaxCategories.value }),
    }).catch(err => console.error('[useTaxMaster] サーバー保存失敗:', err))
    try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(allTaxCategories.value)) } catch { /* 無視 */ }
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

/** 全税区分（マスタデフォルト + カスタム追加分。非表示フラグ適用済み） */
const masterTaxCategories = computed<MasterTaxCategory[]>(() => {
  return allTaxCategories.value
    .map(tc => ({
      ...tc,
      hiddenInMaster: tc.deprecated === true,
    }))
    .sort((a, b) => (a.displayOrder ?? 9999) - (b.displayOrder ?? 9999))
})

/** デフォルト表示の税区分のみ */
const visibleMasterTaxCategories = computed<MasterTaxCategory[]>(() =>
  masterTaxCategories.value.filter(tc => {
    if (tc.hiddenInMaster) return false
    return tc.defaultVisible
  })
)

/** 非表示IDの一覧（overrides互換） */
const overrides = computed(() => ({
  hiddenIds: allTaxCategories.value.filter(tc => tc.deprecated).map(tc => tc.id),
  visibilityOverrides: {} as Record<string, boolean>,
  customTaxCategories: allTaxCategories.value.filter(tc => tc.isCustom),
}))

// =============================================
// Composable
// =============================================

export function useTaxMaster() {
  /** 税区分の表示/非表示をトグル */
  function toggleVisibility(taxCategoryId: string): void {
    const idx = allTaxCategories.value.findIndex(tc => tc.id === taxCategoryId)
    if (idx >= 0) {
      const current = allTaxCategories.value[idx]!
      allTaxCategories.value[idx] = { ...current, deprecated: !current.deprecated }
      debounceSave()
    }
  }

  /** defaultVisibleの上書き設定 */
  function setDefaultVisible(taxCategoryId: string, visible: boolean): void {
    const idx = allTaxCategories.value.findIndex(tc => tc.id === taxCategoryId)
    if (idx >= 0) {
      const current = allTaxCategories.value[idx]!
      allTaxCategories.value[idx] = { ...current, defaultVisible: visible }
      debounceSave()
    }
  }

  /** デフォルト設定にリセット */
  function resetToDefault(): void {
    allTaxCategories.value = allTaxCategories.value
      .filter(tc => !tc.isCustom)
      .map(tc => ({ ...tc, deprecated: false }))
    debounceSave()
  }

  return {
    /** 全税区分（非表示含む） */
    masterTaxCategories,
    /** 表示中の税区分のみ */
    visibleMasterTaxCategories,
    /** 現在の差分データ（overrides互換） */
    overrides,
    /** 生データ（API直接取得結果） */
    allTaxCategories,
    toggleVisibility,
    setDefaultVisible,
    resetToDefault,
  }
}
