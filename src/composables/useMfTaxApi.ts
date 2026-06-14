/**
 * useMfTaxApi.ts — MF税区分マスタ用APIクライアント（フロントエンド）
 *
 * 責務: 全社税区分マスタページ(MockMasterTaxCategoriesPage)が必要とする
 *       全てのAPI呼び出しを集約し、fetch直叩きを排除する。
 *
 * 準拠:
 *   - load_context.md: ロジックはAPI側に書け
 *   - §15: MFがSSOT
 */

import { useClients } from '@/features/client-management/composables/useClients'

// ---------- 型定義 ----------

export interface MfClientInfo {
  clientId: string
  threeCode: string
  companyName: string
  lastImported?: string
}

export interface MfPatternInfo {
  pattern: string
  clientId?: string
  importedAt: string
}

export interface MfPreviewResult {
  hasDiff: boolean
  autoRuleApplied: number
  pattern: string
  reportLines: string[]
}

export interface MfApplyResult {
  updatedMaster: unknown[]
  unknownTaxNames?: string[]
}

// ---------- API関数 ----------

/** MF課税方式別availableデータを取得 */
export async function fetchTaxAvailable(): Promise<Record<string, Record<string, boolean>>> {
  const res = await fetch('/api/mf/tax-available')
  if (!res.ok) return {}
  return res.json()
}

/** MF生データ（パターン進捗）を取得 */
export async function fetchMfRawData(): Promise<{ patterns: MfPatternInfo[] }> {
  const res = await fetch('/api/mf/raw-data')
  if (!res.ok) return { patterns: [] }
  return res.json()
}

/** MF認証状態を一括取得 */
export async function fetchMfAuthBulk(clientIds: string[]): Promise<Record<string, { authenticated: boolean }>> {
  const res = await fetch('/api/mf/auth/status/bulk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clientIds }),
  })
  if (!res.ok) return {}
  return res.json()
}

/** MF事業者名を取得 */
export async function fetchMfOfficeName(clientId: string): Promise<string | null> {
  try {
    const res = await fetch(`/api/mf/office?clientId=${clientId}`)
    if (!res.ok) return null
    const data = await res.json()
    return data.office?.name ?? null
  } catch {
    return null
  }
}

/** MFインポート プレビュー（差分検知） */
export async function previewMfImport(clientId: string): Promise<MfPreviewResult> {
  const res = await fetch('/api/mf/import-taxes/preview', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clientId }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error ?? err.detail ?? 'プレビュー失敗')
  }
  return res.json()
}

/** MFインポート 適用 */
export async function applyMfImport(clientId: string): Promise<MfApplyResult> {
  const res = await fetch('/api/mf/import-taxes/apply', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clientId }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error ?? err.detail ?? '適用失敗')
  }
  return res.json()
}

// ---------- 顧問先リスト取得（repos直叩き解消） ----------

/**
 * MF連携済み顧問先リストを構築する
 * useClients composable経由で全顧問先を取得し、
 * MF認証状態を一括チェックして連携済みのみ返す。
 */
export async function fetchMfLinkedClients(): Promise<MfClientInfo[]> {
  const { clients, refresh } = useClients()
  await refresh()

  const ids = clients.value.map(c => c.clientId)
  if (ids.length === 0) return []

  const bulkData = await fetchMfAuthBulk(ids)

  const authenticatedClients: MfClientInfo[] = []
  for (const cl of clients.value) {
    if (bulkData[cl.clientId]?.authenticated) {
      authenticatedClients.push({
        clientId: cl.clientId,
        threeCode: cl.threeCode ?? '',
        companyName: cl.companyName ?? '',
      })
    }
  }

  // MFから最新の事業者名を取得
  for (const cl of authenticatedClients) {
    const name = await fetchMfOfficeName(cl.clientId)
    if (name) cl.companyName = name
  }

  return authenticatedClients
}
