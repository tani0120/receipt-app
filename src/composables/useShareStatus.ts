/**
 * useShareStatus — 共有設定 composable
 *
 * Repository経由でデータアクセス。ロジックは含まない。
 * 進捗管理画面・アップロード管理画面の両方から使用。
 *
 * ⚠️ このcomposableはデータの取得・更新の「操作」のみ。
 *    判断ロジック（例: pendingをactiveに変えるべきかの判断）は呼び出し側が行う。
 */

import { ref } from 'vue'
import { createRepositories } from '@/repositories'
import type { ShareStatusRecord, ShareStatus } from '@/repositories/types'

/** シングルトンrepos（同一Mapを参照するため） */
const repos = createRepositories()

/** 全件キャッシュ（リアクティブ。画面間で共有） */
const allRecords = ref<ShareStatusRecord[]>([])

/** 最終ロード時刻 */
const lastLoaded = ref<number>(0)

export function useShareStatus() {
  /** 全顧問先の共有設定をロード */
  async function loadAll(): Promise<void> {
    allRecords.value = await repos.shareStatus.getAll()
    lastLoaded.value = Date.now()
  }

  /** 顧問先IDで共有設定を取得 */
  async function getByClientId(clientId: string): Promise<ShareStatusRecord | undefined> {
    return await repos.shareStatus.getByClientId(clientId)
  }

  /** 共有設定ステータスを更新し、キャッシュをリロード */
  async function updateStatus(clientId: string, status: ShareStatus): Promise<void> {
    await repos.shareStatus.updateStatus(clientId, status)
    await loadAll()
  }

  /** 招待コードを保存し、キャッシュをリロード */
  async function saveInviteCode(clientId: string, code: string): Promise<void> {
    await repos.shareStatus.saveInviteCode(clientId, code)
    await loadAll()
  }

  /** clientIdからステータスを引く（キャッシュ内検索。表示用） */
  function getStatusFromCache(clientId: string): ShareStatus | null {
    const rec = allRecords.value.find(r => r.clientId === clientId)
    return rec?.status ?? null
  }

  /** clientIdから招待コードを引く（キャッシュ内検索） */
  function getInviteCodeFromCache(clientId: string): string | null {
    const rec = allRecords.value.find(r => r.clientId === clientId)
    return rec?.inviteCode ?? null
  }

  return {
    /** 全件リアクティブ配列（画面間共有） */
    allRecords,
    loadAll,
    getByClientId,
    updateStatus,
    saveInviteCode,
    getStatusFromCache,
    getInviteCodeFromCache,
  }
}
