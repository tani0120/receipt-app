/**
 * useClientTaxCategories — 顧問先税区分 composable（API接続版）
 *
 * 【設計原則】useJournals.tsパターン準拠
 * - サーバーAPI（/api/tax-categories/client/:clientId）を通じてデータを永続化
 * - 顧問先ID別キャッシュMapでフロント側キャッシュ
 * - 変更操作時にサーバーへ自動保存（デバウンス300ms）
 * - 初回アクセス時にサーバーから読み込み
 *
 * 準拠: DL-042, Phase 2 Step 5
 */
import { ref, computed, watch, type Ref } from 'vue'
import { useTaxMaster } from './useTaxMaster'
import type { TaxCategory } from '@/types/shared-tax-category'

// =============================================
// 型定義
// =============================================

/** 顧問先レベルの税区分 */
export interface ClientTaxCategory extends TaxCategory {
  /** 顧問先で非表示に設定されているか */
  hiddenInClient: boolean
  /** マスタレベルで非表示か */
  hiddenInMaster: boolean
  /** 顧問先レベルのAI選択可否上書き（null=マスタ設定を使用） */
  aiSelectableOverride: boolean | null
}

interface ClientTaxOverrides {
  hiddenIds: string[]
  aiSelectableOverrides: Record<string, boolean>
  copiedMasterIds: string[]
  /** ページで追加されたカスタム税区分 */
  customTaxCategories: TaxCategory[]
  /** MF事業者固有ID保持マップ（税区分マスタID → mfTaxId）。PUT上書き時にmfTaxIdが消えないようにする */
  mfTaxIdMap: Record<string, string>
}

// =============================================
// API通信ヘルパー
// =============================================

const API_BASE = '/api/tax-categories'

interface ClientFetchResult {
  items: TaxCategory[]
  mfLinked: boolean
}

async function fetchClientFromServer(clientId: string): Promise<ClientFetchResult | null> {
  try {
    const res = await fetch(`${API_BASE}/client/${encodeURIComponent(clientId)}?pageSize=200`)
    if (!res.ok) return null
    const data = await res.json() as { items: TaxCategory[]; mfLinked?: boolean }
    return { items: data.items, mfLinked: data.mfLinked ?? false }
  } catch (err) {
    console.error(`[useClientTaxCategories] サーバー取得失敗 (${clientId}):`, err)
    return null
  }
}

async function saveClientToServer(clientId: string, taxCategories: TaxCategory[]): Promise<void> {
  try {
    await fetch(`${API_BASE}/client/${encodeURIComponent(clientId)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taxCategories }),
    })
  } catch (err) {
    console.error(`[useClientTaxCategories] サーバー保存失敗 (${clientId}):`, err)
  }
}

// =============================================
// 顧問先別キャッシュ
// =============================================

interface ClientTaxCache {
  overrides: Ref<ClientTaxOverrides>
  initialized: boolean
  /** MF連携済みかどうか（サーバーAPIからデータ駆動で取得） */
  mfLinked: Ref<boolean>
}

const clientCacheMap = new Map<string, ClientTaxCache>()

// =============================================
// Composable
// =============================================

export function useClientTaxCategories(clientId: string) {
  const { masterTaxCategories, allTaxCategories } = useTaxMaster()

  function createInitialCopy(): ClientTaxOverrides {
    return {
      hiddenIds: masterTaxCategories.value
        .filter(tc => tc.hiddenInMaster)
        .map(tc => tc.taxCategoryId),
      aiSelectableOverrides: {},
      copiedMasterIds: masterTaxCategories.value.map(tc => tc.taxCategoryId),
      customTaxCategories: [],
      mfTaxIdMap: {},
    }
  }

  // キャッシュから取得、なければ新規作成
  if (!clientCacheMap.has(clientId)) {
    const overridesRef = ref<ClientTaxOverrides>(createInitialCopy())
    const mfLinkedRef = ref(false)
    const cache: ClientTaxCache = { overrides: overridesRef, initialized: false, mfLinked: mfLinkedRef }
    clientCacheMap.set(clientId, cache)

    // autoSave: overrides変更時にサーバーへ自動保存（デバウンス300ms）
    let saveTimer: ReturnType<typeof setTimeout> | null = null
    watch(overridesRef, () => {
      if (!cache.initialized) return
      if (saveTimer) clearTimeout(saveTimer)
      saveTimer = setTimeout(() => {
        const allRows = buildFullTaxCategoryList(overridesRef.value, masterTaxCategories.value)
        saveClientToServer(clientId, allRows)
      }, 300)
    }, { deep: true })

    // 非同期でサーバーから初期データを取得
    fetchClientFromServer(clientId).then(result => {
      if (result && result.items.length > 0) {
        const serverData = result.items
        // MF連携状態をデータ駆動で取得（サーバーAPIから）
        mfLinkedRef.value = result.mfLinked
        const masterIds = new Set(masterTaxCategories.value.map(tc => tc.taxCategoryId))
        // mfTaxIdマップを構築（PUT上書き時に消えないようにする）
        const mfTaxIdMap: Record<string, string> = {}
        for (const tc of serverData) {
          if (tc.mfTaxId) mfTaxIdMap[tc.taxCategoryId] = tc.mfTaxId
        }
        overridesRef.value = {
          hiddenIds: serverData.filter(tc => tc.hidden).map(tc => tc.taxCategoryId),
          aiSelectableOverrides: buildAiSelectableOverrides(serverData),
          copiedMasterIds: serverData.filter(tc => masterIds.has(tc.taxCategoryId)).map(tc => tc.taxCategoryId),
          customTaxCategories: serverData.filter(tc => !masterIds.has(tc.taxCategoryId)),
          mfTaxIdMap,
        }
        console.log(`[useClientTaxCategories] ${clientId}: サーバーから${serverData.length}件を取得 (MF連携=${result.mfLinked})`)
      } else {
        const allRows = buildFullTaxCategoryList(overridesRef.value, masterTaxCategories.value)
        saveClientToServer(clientId, allRows)
        console.log(`[useClientTaxCategories] ${clientId}: マスタから初期コピーを作成`)
      }
      cache.initialized = true
    })
  }

  const cache = clientCacheMap.get(clientId)!
  const overrides = cache.overrides

  /** マスタのaiSelectableと異なる値をoverridesとして抽出 */
  function buildAiSelectableOverrides(items: TaxCategory[]): Record<string, boolean> {
    const result: Record<string, boolean> = {}
    items.forEach(tc => {
      const master = allTaxCategories.value.find(m => m.taxCategoryId === tc.taxCategoryId)
      if (master && tc.aiSelectable !== master.aiSelectable) {
        result[tc.taxCategoryId] = tc.aiSelectable
      }
    })
    return result
  }

  /** overridesからフル税区分リストを再構成 */
  function buildFullTaxCategoryList(ov: ClientTaxOverrides, master: TaxCategory[]): TaxCategory[] {
    const defaultRows = master.map(tc => ({
      ...tc,
      hidden: tc.hidden || ov.hiddenIds.includes(tc.taxCategoryId),
      aiSelectable: ov.aiSelectableOverrides[tc.taxCategoryId] ?? tc.aiSelectable,
      // MF事業者固有IDを保持（PUT上書き時に消えないようにする）
      mfTaxId: ov.mfTaxIdMap[tc.taxCategoryId] ?? tc.mfTaxId,
    }))
    return [...defaultRows, ...ov.customTaxCategories]
  }

  const clientTaxCategories = computed<ClientTaxCategory[]>(() => {
    const baseRows: ClientTaxCategory[] = masterTaxCategories.value.map(tc => {
      const aiOverride = overrides.value.aiSelectableOverrides[tc.taxCategoryId] ?? null
      return {
        ...tc,
        hiddenInClient: overrides.value.hiddenIds.includes(tc.taxCategoryId) || tc.hidden,
        // MF連携済み: hiddenInMasterを無視（MFインポートが正）
        // MF未連携: hiddenInMasterをそのまま使う（全社マスタが正）
        hiddenInMaster: tc.hidden || (cache.mfLinked.value ? false : tc.hiddenInMaster),
        aiSelectableOverride: aiOverride,
        aiSelectable: aiOverride !== null ? aiOverride : tc.aiSelectable,
      }
    })

    const masterIds = new Set(masterTaxCategories.value.map(tc => tc.taxCategoryId))
    const clientCustomRows: ClientTaxCategory[] = (overrides.value.customTaxCategories ?? [])
      .filter(tc => !masterIds.has(tc.taxCategoryId))
      .map(tc => ({
        ...tc,
        hiddenInClient: overrides.value.hiddenIds.includes(tc.taxCategoryId),
        hiddenInMaster: false,
        aiSelectableOverride: overrides.value.aiSelectableOverrides[tc.taxCategoryId] ?? null,
        isCustom: true,
      }))

    return [...baseRows, ...clientCustomRows].sort((a, b) => (a.displayOrder ?? 9999) - (b.displayOrder ?? 9999))
  })

  const visibleClientTaxCategories = computed<ClientTaxCategory[]>(() =>
    clientTaxCategories.value.filter(tc => !tc.hiddenInClient && !tc.hiddenInMaster)
  )

  function toggleVisibility(taxCategoryId: string): void {
    const idx = overrides.value.hiddenIds.indexOf(taxCategoryId)
    if (idx >= 0) {
      overrides.value.hiddenIds.splice(idx, 1)
    } else {
      overrides.value.hiddenIds.push(taxCategoryId)
    }
  }

  /** AI選択可否を上書き（ルール9） */
  function setAiSelectable(taxCategoryId: string, selectable: boolean): void {
    overrides.value.aiSelectableOverrides[taxCategoryId] = selectable
  }

  function resetToDefault(): void {
    overrides.value = createInitialCopy()
  }

  /** ページから全行データを受け取り、composableの保存形式に分解して保存 */
  function saveAll(allRows: TaxCategory[]): void {
    // hidden=trueの行を非表示IDに含める
    const hiddenIds = allRows.filter(r => r.hidden).map(r => r.taxCategoryId)
    const customTaxCategories = allRows.filter(r => r.isCustom)
    const aiSelectableOverrides: Record<string, boolean> = {}
    allRows.forEach(r => {
      const master = allTaxCategories.value.find(m => m.taxCategoryId === r.taxCategoryId)
      if (master && r.aiSelectable !== master.aiSelectable) {
        aiSelectableOverrides[r.taxCategoryId] = r.aiSelectable
      }
    })
    // allRowsからmfTaxIdMapを再構築（import-client-taxes結果のmfTaxIdを保持）
    const mfTaxIdMap: Record<string, string> = { ...overrides.value.mfTaxIdMap }
    for (const r of allRows) {
      if (r.mfTaxId) mfTaxIdMap[r.taxCategoryId] = r.mfTaxId
    }
    overrides.value = {
      hiddenIds,
      customTaxCategories,
      aiSelectableOverrides,
      copiedMasterIds: allTaxCategories.value.map(t => t.taxCategoryId),
      mfTaxIdMap,
    }
    // autoSaveで自動的にサーバーへ保存される
  }

  return {
    clientTaxCategories,
    visibleClientTaxCategories,
    toggleVisibility,
    setAiSelectable,
    resetToDefault,
    saveAll,
  }
}
