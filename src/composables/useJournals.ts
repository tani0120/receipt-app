/**
 * useJournals — 仕訳データのデータアクセスcomposable（API接続版）
 *
 * 【設計原則】
 * - サーバーAPIを通じてデータを永続化（JSON永続化ストア）
 * - モジュールスコープのキャッシュMapでフロント側のキャッシュを保持
 * - deep watchでデータ変更時にサーバーに自動保存（デバウンス500ms）
 * - 初回アクセス時にサーバーから読み込み。データがなければ空配列のまま。
 * - 顧問先登録時にサーバー側でjournals-{clientId}.jsonが自動生成される
 *
 * 準拠: DL-042（#12 useJournals localStorage脱却）
 */
import { ref, watch, type Ref } from 'vue'
import type { JournalPhase5Mock } from '../types/journal_phase5_mock.type'

// ────────────────────────────────────────────
// API通信ヘルパー
// ────────────────────────────────────────────
const API_BASE = '/api/journals'

async function fetchFromServer(clientId: string): Promise<JournalPhase5Mock[] | null> {
  try {
    const res = await fetch(`${API_BASE}/${encodeURIComponent(clientId)}`)
    if (!res.ok) return null
    const data = await res.json() as { journals: JournalPhase5Mock[]; count: number }
    return data.journals ?? []
  } catch (err) {
    console.error(`[useJournals] サーバー取得失敗 (${clientId}):`, err)
    return null
  }
}

async function saveToServer(clientId: string, journals: JournalPhase5Mock[]): Promise<void> {
  try {
    await fetch(`${API_BASE}/${encodeURIComponent(clientId)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ journals }),
    })
  } catch (err) {
    console.error(`[useJournals] サーバー保存失敗 (${clientId}):`, err)
  }
}

// ────────────────────────────────────────────
// モジュールスコープキャッシュ（顧問先別シングルトン）
// ────────────────────────────────────────────
const journalCache = new Map<string, Ref<JournalPhase5Mock[]>>()

// ────────────────────────────────────────────
// Composable
// ────────────────────────────────────────────

export function useJournals(clientId: Ref<string>) {
  function getOrCreate(cid: string): Ref<JournalPhase5Mock[]> {
    if (!journalCache.has(cid)) {
      // 空配列で初期化（サーバーデータ取得まで空表示）
      const data = ref<JournalPhase5Mock[]>([])
      journalCache.set(cid, data)

      // autoSave: データ変更時にサーバーへ自動保存（デバウンス500ms）
      // initialized フラグで初回ロード中の誤保存を防止
      let timer: ReturnType<typeof setTimeout> | null = null
      let initialized = false

      watch(data, () => {
        if (!initialized) return
        if (timer) clearTimeout(timer)
        timer = setTimeout(() => saveToServer(cid, data.value), 500)
      }, { deep: true })

      // 非同期でサーバーからデータを取得
      fetchFromServer(cid).then(serverData => {
        if (serverData && serverData.length > 0) {
          data.value = serverData
          console.log(`[useJournals] ${cid}: サーバーから${serverData.length}件を取得`)
        } else {
          console.log(`[useJournals] ${cid}: データなし（空配列）`)
        }
        // ロード完了後にautoSaveを有効化
        initialized = true
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
