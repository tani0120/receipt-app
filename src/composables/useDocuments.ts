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
    const now = new Date().toISOString()
    const resolvedStaffId = staffId ?? null

    const doc = allDocuments.value.find(d => d.id === id)
    if (doc) {
      doc.status = status
      doc.statusChangedBy = resolvedStaffId
      doc.statusChangedAt = now
      doc.updatedBy = resolvedStaffId
      doc.updatedAt = now
    }

    // サーバーにも反映（fire-and-forget。ローカルと同じnowを使用）
    fetch(`${API_BASE}/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, statusChangedBy: resolvedStaffId, statusChangedAt: now, updatedBy: resolvedStaffId, updatedAt: now }),
    }).catch(err => console.error('[useDocuments] ステータス更新エラー:', err))
  }

  /** 顧問先の全資料をrefから消去（仕訳処理送出後） */
  function removeByClientId(clientId: string) {
    allDocuments.value = allDocuments.value.filter(d => d.clientId !== clientId)

    // サーバーにも反映（エラー時はユーザーに通知）
    fetch(`${API_BASE}/client/${encodeURIComponent(clientId)}`, {
      method: 'DELETE',
    }).then(res => {
      if (!res.ok) {
        console.error(`[useDocuments] サーバー削除失敗: HTTP ${res.status}`)
        alert('データの削除に失敗しました。ページをリロードしてください。')
      }
    }).catch(err => {
      console.error('[useDocuments] 削除エラー:', err)
      alert('データの削除に失敗しました。ネットワーク接続を確認してください。')
    })
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

    // サーバーにも反映（エラー時はユーザーに通知）
    if (newDocs.length > 0) {
      fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documents: newDocs }),
      }).then(res => {
        if (!res.ok) {
          console.error(`[useDocuments] サーバー保存失敗: HTTP ${res.status}`)
          alert('データの保存に失敗しました。ページをリロードしてください。')
        }
      }).catch(err => {
        console.error('[useDocuments] 追加エラー:', err)
        alert('データの保存に失敗しました。ネットワーク接続を確認してください。')
      })
    }

    return newDocs.length
  }

  /** 選別完了→送出時にbatchId/journalIdを全件付与（サーバー発番） */
  async function assignBatchAndJournalIds(clientId: string) {
    try {
      const res = await fetch(`${API_BASE}/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId }),
      })
      if (!res.ok) {
        console.error(`[useDocuments] バッチ付与失敗: HTTP ${res.status}`)
        return { batchId: '', count: 0 }
      }
      const data = await res.json() as { batchId: string; count: number }
      // サーバー発番済みデータでrefを更新
      await refresh(clientId)
      console.log(`[useDocuments] batchId=${data.batchId} journalId付与: ${data.count}件（サーバー発番）`)
      return data
    } catch (err) {
      console.error('[useDocuments] バッチ付与エラー:', err)
      return { batchId: '', count: 0 }
    }
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

  /**
   * previewExtractデータ（ai*フィールド）を完全削除
   *
   * 確定送信後に呼び出す。仕訳変換完了後に実行すること。
   * 設計方針: previewExtract.service.ts ヘッダー参照
   */
  /**
   * previewExtractデータ（ai*フィールド）を完全削除
   *
   * サーバーAPIでフィールド削除後、refresh()でrefを再取得する。
   * ローカルrefの直接書き換えは行わない（設計方針: composableにロジック禁止）。
   */
  async function clearAiFields(clientId: string) {
    try {
      const res = await fetch(`${API_BASE}/clear-ai/${encodeURIComponent(clientId)}`, {
        method: 'POST',
      })
      if (!res.ok) {
        console.error(`[useDocuments] previewExtractデータ削除失敗: HTTP ${res.status}`)
        return
      }
      // サーバーで削除完了後、refを再取得して反映
      await refresh(clientId)
      console.log(`[useDocuments] previewExtractデータ削除+再取得完了: ${clientId}`)
    } catch (err) {
      console.error('[useDocuments] previewExtractデータ削除エラー:', err)
    }
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
    /** previewExtractデータ完全削除（確定送信後） */
    clearAiFields,
  }
}
