/**
 * useShareStatus — 共有設定 composable
 *
 * モジュールスコープのrefでデータを直接保持（useClients/useStaff方式と統一）。
 * 進捗管理画面・アップロード管理画面の両方から使用。
 *
 * ⚠️ このcomposableはデータの取得・更新の「操作」のみ。
 *    判断ロジック（例: pendingをactiveに変えるべきかの判断）は呼び出し側が行う。
 *
 * 【移行メモ】
 * 画面仕様確定後にRepository経由（createRepositories()）に差し替える。
 * インターフェース（loadAll, updateStatus等）は変更不要な設計。
 */

import { ref } from 'vue'
import type { ShareStatusRecord, ShareStatus } from '@/repositories/types'

// =============================================
// モジュールスコープ（シングルトン）
// 画面間で共有。useClients/useStaffと同じ方式。
// =============================================

/** 全件データ（リアクティブ。画面間で共有） */
const allRecords = ref<ShareStatusRecord[]>([])

/** 最終ロード時刻 */
const lastLoaded = ref<number>(0)

export function useShareStatus() {
  /** 全顧問先の共有設定をロード（現在はrefから直接返却） */
  async function loadAll(): Promise<void> {
    // ref直接保持のため、追加のロード処理は不要
    lastLoaded.value = Date.now()
  }

  /** 顧問先IDで共有設定を取得 */
  async function getByClientId(clientId: string): Promise<ShareStatusRecord | undefined> {
    return allRecords.value.find(r => r.clientId === clientId)
  }

  /** 共有設定ステータスを更新 */
  async function updateStatus(clientId: string, status: ShareStatus): Promise<void> {
    const existing = allRecords.value.find(r => r.clientId === clientId)
    if (existing) {
      existing.status = status
      existing.updatedAt = new Date().toISOString()
    } else {
      allRecords.value.push({
        clientId,
        status,
        inviteCode: null,
        updatedAt: new Date().toISOString(),
      })
    }
  }

  /** 招待コードを保存 */
  async function saveInviteCode(clientId: string, code: string): Promise<void> {
    const existing = allRecords.value.find(r => r.clientId === clientId)
    if (existing) {
      existing.inviteCode = code
      existing.updatedAt = new Date().toISOString()
    } else {
      allRecords.value.push({
        clientId,
        status: 'pending',
        inviteCode: code,
        updatedAt: new Date().toISOString(),
      })
    }
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
