/**
 * useJournals — 仕訳データのデータアクセスcomposable（API接続版）
 *
 * 【設計原則】
 * - サーバーAPIを通じてデータを永続化（JSON永続化ストア）
 * - モジュールスコープのキャッシュMapでフロント側のキャッシュを保持
 * - deep watchでデータ変更時にサーバーに自動保存（デバウンス500ms）
 * - 初回アクセス時にサーバーから読み込み。サーバーにデータがなければフィクスチャを投入
 *
 * 【移行時】
 * - サーバー側のjournalStoreをDB操作に差し替え
 * - フロント側のAPI呼び出しは変更不要
 *
 * 準拠: DL-042（#12 useJournals localStorage脱却）
 */
import { ref, watch, type Ref } from 'vue'
import { mockJournalsPhase5 as fixtureData } from '../data/journal_test_fixture_30cases'
import type { JournalPhase5Mock } from '../types/journal_phase5_mock.type'

// ────────────────────────────────────────────
// フィクスチャバージョン（フィクスチャ更新時にインクリメント）
// FIXTURE_VERSIONはこのファイルのみで管理する
// ────────────────────────────────────────────
const FIXTURE_VERSION = 13

// ────────────────────────────────────────────
// API通信ヘルパー
// ────────────────────────────────────────────
const API_BASE = '/api/journals'

async function fetchFromServer(clientId: string): Promise<JournalPhase5Mock[] | null> {
  try {
    const res = await fetch(`${API_BASE}/${encodeURIComponent(clientId)}`)
    if (!res.ok) return null
    const data = await res.json() as { journals: JournalPhase5Mock[]; count: number }
    return data.count > 0 ? data.journals : null
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

/**
 * フィクスチャデータからデフォルトの仕訳を取得
 * （サーバーにデータがない場合のフォールバック）
 */
function getFixtureData(clientId: string): JournalPhase5Mock[] {
  const clientFiltered = fixtureData.filter(j => j.client_id === clientId)
  const base = clientFiltered.length > 0 ? clientFiltered : fixtureData
  return JSON.parse(JSON.stringify(base))
}

/**
 * localStorageから旧データを移行する。
 * 移行後にlocalStorageから削除する。
 */
function migrateFromLocalStorage(clientId: string): JournalPhase5Mock[] | null {
  const key = `sugu-suru:journals:${clientId}`
  const versionKey = `sugu-suru:journals-version:${clientId}`
  try {
    const savedVersion = localStorage.getItem(versionKey)
    if (savedVersion && Number(savedVersion) === FIXTURE_VERSION) {
      const raw = localStorage.getItem(key)
      if (raw) {
        const data = JSON.parse(raw) as JournalPhase5Mock[]
        // 移行完了後にlocalStorageから削除
        localStorage.removeItem(key)
        localStorage.removeItem(versionKey)
        console.log(`[useJournals] ${clientId}: localStorageから${data.length}件を移行`)
        return data
      }
    }
    // バージョン不一致 or データなし → localStorageを削除
    localStorage.removeItem(key)
    localStorage.removeItem(versionKey)
  } catch { /* 破損データは無視 */ }
  return null
}

// ────────────────────────────────────────────
// Composable
// ────────────────────────────────────────────

export function useJournals(clientId: Ref<string>) {
  // 顧問先ごとにシングルトンrefを管理
  // autoSaveのwatchもgetOrCreate内で1回だけ登録
  function getOrCreate(cid: string): Ref<JournalPhase5Mock[]> {
    if (!journalCache.has(cid)) {
      // 同期的にフィクスチャデータで初期化（画面がすぐ表示されるように）
      const data = ref<JournalPhase5Mock[]>(getFixtureData(cid))
      journalCache.set(cid, data)

      // 非同期でサーバーからデータを取得し、あれば差し替え
      loadFromServer(cid, data)

      // autoSave: データ変更時にサーバーへ自動保存（デバウンス500ms）
      let timer: ReturnType<typeof setTimeout> | null = null
      watch(data, () => {
        if (timer) clearTimeout(timer)
        timer = setTimeout(() => saveToServer(cid, data.value), 500)
      }, { deep: true })
    }
    return journalCache.get(cid)!
  }

  /** サーバーからデータを取得し、refに設定 */
  async function loadFromServer(cid: string, data: Ref<JournalPhase5Mock[]>): Promise<void> {
    // 1. サーバーにデータがあればそれを使用
    const serverData = await fetchFromServer(cid)
    if (serverData && serverData.length > 0) {
      data.value = serverData
      console.log(`[useJournals] ${cid}: サーバーから${serverData.length}件を取得`)
      return
    }

    // 2. localStorageに旧データがあれば移行
    const migrated = migrateFromLocalStorage(cid)
    if (migrated && migrated.length > 0) {
      data.value = migrated
      // サーバーに保存
      saveToServer(cid, migrated)
      return
    }

    // 3. TST-00011はパイプライン貫通テスト用: フィクスチャ投入をスキップ（空のまま）
    if (cid === 'TST-00011') {
      data.value = []
      console.log(`[useJournals] ${cid}: テスト用クライアント。フィクスチャ投入スキップ（空配列）`)
      return
    }

    // 4. フィクスチャデータはそのまま使用（getOrCreateで設定済み）
    // サーバーにもフィクスチャを保存しておく
    saveToServer(cid, data.value)
    console.log(`[useJournals] ${cid}: フィクスチャ${data.value.length}件をサーバーに初期投入`)
  }

  // キャッシュのrefを直接返す（コピーではなく同一参照）
  // → 全コンポーネントが同じrefを共有 → データ一致が保証される
  return {
    journals: getOrCreate(clientId.value),
  }
}
