/**
 * useDocuments — 資料管理 composable
 *
 * 【設計原則】
 * - DocumentRepository経由でデータを永続化
 * - モジュールスコープのrefでフロント側のキャッシュを保持
 * - Repository経由でデータ操作 → サーバー側で永続化
 *
 * 【移行時】
 * - createRepositories()内のdocument実装をSupabase版に差し替えるだけ
 * - このcomposableの変更は不要
 *
 * 準拠: DL-039, DL-042
 */
import { ref, computed } from 'vue'
import type { DocEntry, DocStatus } from '@/repositories/types'
import { UI_MSG } from '@/constants/uiMessages'

// ============================================================
// モジュールスコープref（ページ遷移しても保持される）
// ============================================================
const allDocuments = ref<DocEntry[]>([])
/** 初回ロード済みフラグ */
const loaded = ref(false)

// ============================================================
// Repository取得ヘルパー（遅延インポートで循環参照回避）
// ============================================================
async function getDocRepo() {
  const { createRepositories } = await import('@/repositories')
  return createRepositories().document
}

async function fetchFromServer(clientId?: string): Promise<DocEntry[]> {
  try {
    const repo = await getDocRepo()
    return clientId ? await repo.getByClientId(clientId) : await repo.getAll()
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
    getDocRepo().then(repo =>
      repo.updateStatus(id, { status, statusChangedBy: resolvedStaffId, statusChangedAt: now, updatedBy: resolvedStaffId, updatedAt: now })
    ).catch(err => console.error('[useDocuments] ステータス更新エラー:', err))
  }

  /** 顧問先の全資料をrefから消去（仕訳処理送出後） */
  function removeByClientId(clientId: string) {
    allDocuments.value = allDocuments.value.filter(d => d.clientId !== clientId)

    // サーバーにも反映（エラー時はユーザーに通知）
    getDocRepo().then(repo =>
      repo.removeByClientId(clientId)
    ).catch(err => {
      console.error('[useDocuments] 削除エラー:', err)
      alert(UI_MSG.データ削除失敗ネットワーク)
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
      getDocRepo().then(repo =>
        repo.saveBatch(newDocs)
      ).then(result => {
        if (result && result.added === 0 && newDocs.length > 0) {
          console.warn(`[useDocuments] サーバー保存: 追加0件（全件重複）`)
        }
      }).catch(err => {
        console.error('[useDocuments] 追加エラー:', err)
        alert(UI_MSG.データ保存失敗接続確認)
      })
    }

    return newDocs.length
  }

  /** 選別完了→送出時にbatchId/journalIdを全件付与（サーバー発番） */
  async function assignBatchAndJournalIds(clientId: string) {
    try {
      const repo = await getDocRepo()
      const data = await repo.assignBatch(clientId)
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
   * サーバーAPIでフィールド削除後、refresh()でrefを再取得する。
   * ローカルrefの直接書き換えは行わない（設計方針: composableにロジック禁止）。
   */
  async function clearAiFields(clientId: string) {
    try {
      const repo = await getDocRepo()
      await repo.clearAiFields(clientId)
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
