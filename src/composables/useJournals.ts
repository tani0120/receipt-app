/**
 * useJournals — 仕訳データのデータアクセスcomposable（読み取り専用）
 *
 * 【設計原則】
 * - サーバーAPIを通じてデータを取得（JSON永続化ストア）
 * - モジュールスコープのキャッシュMapでフロント側のキャッシュを保持
 * - 初回アクセス時にサーバーから読み込み。データがなければ空配列のまま。
 * - データ変更はPATCH API経由（JournalListLevel3MockのupdateJournalField経由）
 *
 * Phase 3-3: PUT全件上書き（autoSave）を廃止。
 *   Phase Cで全更新がPATCH API移行済みのため、deep watch autoSaveは冗長だった。
 *
 * 準拠: DL-042（#12 useJournals localStorage脱却）
 */
import { ref, type Ref } from 'vue'
import type { Journal } from '../types/journal.type'

// ────────────────────────────────────────────
// API通信ヘルパー
// ────────────────────────────────────────────
const API_BASE = '/api/journals'

async function fetchFromServer(clientId: string): Promise<Journal[] | null> {
  try {
    const res = await fetch(`${API_BASE}/${encodeURIComponent(clientId)}`)
    if (!res.ok) return null
    const data = await res.json() as { journals: Journal[]; count: number }
    return data.journals ?? []
  } catch (err) {
    console.error(`[useJournals] サーバー取得失敗 (${clientId}):`, err)
    return null
  }
}

// ────────────────────────────────────────────
// モジュールスコープキャッシュ（顧問先別シングルトン）
// ────────────────────────────────────────────
const journalCache = new Map<string, Ref<Journal[]>>()

// ────────────────────────────────────────────
// Composable
// ────────────────────────────────────────────

export function useJournals(clientId: Ref<string>) {
  function getOrCreate(cid: string): Ref<Journal[]> {
    if (!journalCache.has(cid)) {
      // 空配列で初期化（サーバーデータ取得まで空表示）
      const data = ref<Journal[]>([])
      journalCache.set(cid, data)

      // 非同期でサーバーからデータを取得
      fetchFromServer(cid).then(serverData => {
        if (serverData && serverData.length > 0) {
          data.value = serverData
          console.log(`[useJournals] ${cid}: サーバーから${serverData.length}件を取得`)
        } else {
          console.log(`[useJournals] ${cid}: データなし（空配列）`)
        }
      })
    }
    return journalCache.get(cid)!
  }

  // キャッシュのrefを直接返す（コピーではなく同一参照）
  // → 全コンポーネントが同じrefを共有 → データ一致が保証される
  return {
    journals: getOrCreate(clientId.value),
  }
}
