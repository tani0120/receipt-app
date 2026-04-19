/**
 * useDocuments — 資料管理 composable
 *
 * 【設計原則】
 * - サーバーAPIを通じてデータを永続化（JSON永続化ストア）
 * - モジュールスコープのrefでフロント側のキャッシュを保持
 * - API経由でデータ操作 → サーバー側でJSON永続化
 *
 * 【移行時】
 * - サーバー側のdocumentStoreをDB操作に差し替え
 * - フロント側のAPI呼び出しは変更不要
 *
 * 準拠: DL-039
 */
import { ref, computed } from 'vue'
import type { DocEntry, DocStatus } from '@/repositories/types'

// ============================================================
// モジュールスコープref（ページ遷移しても保持される）
// ============================================================
const allDocuments = ref<DocEntry[]>([])
/** 初回ロード済みフラグ */
const loaded = ref(false)

// ============================================================
// API通信ヘルパー
// ============================================================
const API_BASE = '/api/doc-store'

async function fetchFromServer(clientId?: string): Promise<DocEntry[]> {
  try {
    const url = clientId ? `${API_BASE}?clientId=${encodeURIComponent(clientId)}` : API_BASE
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json() as { documents: DocEntry[] }
    return data.documents
  } catch (err) {
    console.error('[useDocuments] サーバーからの取得に失敗:', err)
    return []
  }
}

/** 起動時にサーバーから全データを取得 */
async function loadAll(): Promise<void> {
  if (loaded.value) return
  const docs = await fetchFromServer()
  allDocuments.value = docs
  loaded.value = true
  console.log(`[useDocuments] サーバーから${docs.length}件を取得`)
}

// 初回ロード（モジュール評価時に実行）
loadAll()

// ============================================================
// Composable
// ============================================================
export function useDocuments() {
  /** 顧問先IDでフィルタした資料一覧 */
  function getByClientId(clientId: string) {
    return computed(() =>
      allDocuments.value.filter(d => d.clientId === clientId)
    )
  }

  /** 資料の選別ステータスを更新（ローカル + サーバー） */
  function updateStatus(id: string, status: DocStatus, staffId?: string | null) {
    const doc = allDocuments.value.find(d => d.id === id)
    if (doc) {
      const now = new Date().toISOString()
      doc.status = status
      doc.statusChangedBy = staffId ?? null
      doc.statusChangedAt = now
      doc.updatedBy = staffId ?? null
      doc.updatedAt = now
    }

    // サーバーにも反映（fire-and-forget）
    fetch(`${API_BASE}/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, statusChangedBy: staffId ?? null, statusChangedAt: new Date().toISOString(), updatedBy: staffId ?? null, updatedAt: new Date().toISOString() }),
    }).catch(err => console.error('[useDocuments] ステータス更新エラー:', err))
  }

  /** 顧問先の全資料をrefから消去（仕訳処理送出後） */
  function removeByClientId(clientId: string) {
    allDocuments.value = allDocuments.value.filter(d => d.clientId !== clientId)

    // サーバーにも反映（fire-and-forget）
    fetch(`${API_BASE}/client/${encodeURIComponent(clientId)}`, {
      method: 'DELETE',
    }).catch(err => console.error('[useDocuments] 削除エラー:', err))
  }

  /** 資料を一括追加（重複チェック: driveFileIdまたはfileHashで判定） */
  function addDocuments(docs: DocEntry[]) {
    const existingDriveIds = new Set(
      allDocuments.value.map(d => d.driveFileId).filter(Boolean)
    )
    const existingHashes = new Set(
      allDocuments.value.map(d => d.fileHash).filter(Boolean)
    )

    const newDocs = docs.filter(d => {
      if (d.driveFileId && existingDriveIds.has(d.driveFileId)) return false
      if (d.fileHash && existingHashes.has(d.fileHash)) return false
      return true
    })

    allDocuments.value.push(...newDocs)
    console.log(`[useDocuments] ${newDocs.length}件追加（重複${docs.length - newDocs.length}件スキップ）`)

    // サーバーにも反映（fire-and-forget）
    if (newDocs.length > 0) {
      fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documents: newDocs }),
      }).catch(err => console.error('[useDocuments] 追加エラー:', err))
    }

    return newDocs.length
  }

  /** 選別完了→送出時にbatchId/journalIdを全件付与 */
  function assignBatchAndJournalIds(clientId: string) {
    const now = new Date()
    const ts = now.toISOString().replace(/[-:T]/g, '').slice(0, 15)
    const batchId = `batch-${clientId}-${ts}`
    const docs = allDocuments.value.filter(d => d.clientId === clientId && !d.batchId)
    for (const doc of docs) {
      doc.batchId = batchId
      doc.journalId = crypto.randomUUID()
    }
    console.log(`[useDocuments] batchId=${batchId} journalId付与: ${docs.length}件`)

    // サーバーにも反映（fire-and-forget）
    fetch(`${API_BASE}/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId }),
    }).catch(err => console.error('[useDocuments] バッチ付与エラー:', err))

    return { batchId, count: docs.length }
  }

  /** サーバーから最新データを再取得 */
  async function refresh(clientId?: string) {
    const docs = await fetchFromServer(clientId)
    if (clientId) {
      // 指定clientIdのデータだけ差し替え
      allDocuments.value = [
        ...allDocuments.value.filter(d => d.clientId !== clientId),
        ...docs,
      ]
    } else {
      allDocuments.value = docs
    }
    console.log(`[useDocuments] refresh: ${docs.length}件を取得`)
  }

  return {
    /** 全顧問先の全資料（ref） */
    allDocuments,
    /** 初回ロード済みフラグ */
    loaded,
    /** 顧問先単位でフィルタ */
    getByClientId,
    /** ステータス更新 */
    updateStatus,
    /** 顧問先の全資料を消去 */
    removeByClientId,
    /** 資料を一括追加（重複チェック付き） */
    addDocuments,
    /** 選別完了→送出時にbatchId/journalId付与 */
    assignBatchAndJournalIds,
    /** サーバーから最新データを再取得 */
    refresh,
  }
}
