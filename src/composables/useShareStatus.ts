/**
 * useShareStatus — 共有設定 composable
 *
 * モジュールスコープのrefでデータを直接保持（useClients/useStaff方式と統一）。
 * 進捗管理画面・アップロード管理画面の両方から使用。
 *
 * ⚠️ このcomposableはデータの取得・更新の「操作」のみ。
 *    判断ロジック（例: pendingをactiveに変えるべきかの判断）は呼び出し側が行う。
 *
 * 【通信方式】ローカルref即反映 + サーバーfire-and-forget
 * - updateStatus: refを更新 → PUTをfire-and-forget
 * - saveInviteCode: refを更新 → POSTをfire-and-forget
 * - loadAll: サーバーからGET → refを差し替え
 * - resolveInviteCode: サーバーにGET（別ブラウザでも動く）
 *
 * 【移行メモ】
 * Supabase移行時にAPI側（shareStatusStore.ts）をDB操作に差し替えるだけ。
 * フロント側は変更不要。
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
  /**
   * 全顧問先の共有設定をサーバーからロード
   * 初回表示時・リロード時に呼ぶ
   */
  async function loadAll(): Promise<void> {
    try {
      const res = await fetch('/api/share-status')
      if (res.ok) {
        const data = await res.json()
        allRecords.value = data.records ?? []
      }
    } catch (err) {
      console.warn('[useShareStatus] サーバーからの読み込み失敗。ローカルrefを維持:', err)
    }
    lastLoaded.value = Date.now()
  }

  /** 顧問先IDで共有設定を取得 */
  async function getByClientId(clientId: string): Promise<ShareStatusRecord | undefined> {
    return allRecords.value.find(r => r.clientId === clientId)
  }

  /** 共有設定ステータスを更新（ref即反映 + サーバーfire-and-forget） */
  async function updateStatus(clientId: string, status: ShareStatus): Promise<void> {
    // ① ローカルref即反映
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
    // ② サーバーfire-and-forget
    fetch(`/api/share-status/${clientId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    }).catch(err => console.warn('[useShareStatus] ステータス更新の永続化失敗:', err))
  }

  /**
   * 招待コードをサーバーで生成して保存（サーバー先行）
   * サーバーがランダムコードを発番して返す。
   */
  async function saveInviteCode(clientId: string): Promise<string> {
    try {
      const res = await fetch('/api/share-status/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json() as { ok: boolean; code: string }
      const code = data.code
      // サーバー成功後にローカルref反映
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
      return code
    } catch (err) {
      console.error('[useShareStatus] 招待コード生成失敗:', err)
      throw err
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

  /** 招待コードからclientIdを逆引き（キャッシュ内検索） */
  function getClientIdByInviteCode(code: string): string | null {
    const rec = allRecords.value.find(r => r.inviteCode === code)
    return rec?.clientId ?? null
  }

  /**
   * 招待コードからclientIdを逆引き（サーバー問い合わせ版）
   * ルーターのbeforeEnterで使用。別ブラウザ/デバイスからでも動く。
   */
  async function resolveInviteCode(code: string): Promise<string | null> {
    // ① まずキャッシュから探す
    const cached = getClientIdByInviteCode(code)
    if (cached) return cached

    // ② キャッシュになければサーバーに問い合わせ
    try {
      const res = await fetch(`/api/share-status/invite/${code}`)
      if (res.ok) {
        const data = await res.json()
        return data.clientId ?? null
      }
    } catch (err) {
      console.warn('[useShareStatus] 招待コード逆引き失敗:', err)
    }
    return null
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
    getClientIdByInviteCode,
    resolveInviteCode,
  }
}
