/**
 * useJournals — 仕訳データのデータアクセスcomposable
 *
 * 目的: 仕訳データのCRUD操作を一元化し、全ページが同じデータソースを参照する
 * パターン: useClients.ts と同じ（モジュールスコープref + composable関数）
 *
 * Phase B TODO: Supabase APIに差し替え（外部インターフェース不変）
 */
import { ref, watch, type Ref } from 'vue'
import { mockJournalsPhase5 as fixtureData } from '../data/journal_test_fixture_30cases'
import type { JournalPhase5Mock } from '../types/journal_phase5_mock.type'

// ────────────────────────────────────────────
// フィクスチャバージョン（フィクスチャ更新時にインクリメント）
// FIXTURE_VERSIONはこのファイルのみで管理する
// ────────────────────────────────────────────
const FIXTURE_VERSION = 12

// ────────────────────────────────────────────
// モジュールスコープキャッシュ（顧問先別シングルトン）
// ────────────────────────────────────────────
const journalCache = new Map<string, Ref<JournalPhase5Mock[]>>()

function loadFromStorage(clientId: string): JournalPhase5Mock[] {
  const key = `sugu-suru:journals:${clientId}`
  const versionKey = `sugu-suru:journals-version:${clientId}`
  try {
    const savedVersion = localStorage.getItem(versionKey)
    if (savedVersion && Number(savedVersion) === FIXTURE_VERSION) {
      const raw = localStorage.getItem(key)
      if (raw) return JSON.parse(raw)
    } else {
      // バージョン不一致: 旧キャッシュを破棄
      localStorage.removeItem(key)
      localStorage.setItem(versionKey, String(FIXTURE_VERSION))
    }
  } catch { /* 破損データは無視 */ }
  localStorage.setItem(versionKey, String(FIXTURE_VERSION))
  // 顧問先IDでフィルタ（一致なしの場合は全データ表示＝デモ用フォールバック）
  const clientFiltered = fixtureData.filter(j => j.client_id === clientId)
  const base = clientFiltered.length > 0 ? clientFiltered : fixtureData
  return JSON.parse(JSON.stringify(base))
}

function saveToStorage(clientId: string, journals: JournalPhase5Mock[]): void {
  const key = `sugu-suru:journals:${clientId}`
  localStorage.setItem(key, JSON.stringify(journals))
}

// ────────────────────────────────────────────
// Composable
// ────────────────────────────────────────────

export function useJournals(clientId: Ref<string>) {
  // 顧問先ごとにシングルトンrefを管理
  // autoSaveのwatchもgetOrCreate内で1回だけ登録
  function getOrCreate(cid: string): Ref<JournalPhase5Mock[]> {
    if (!journalCache.has(cid)) {
      const data = ref(loadFromStorage(cid))
      // autoSave: データ変更時にlocalStorageへ自動保存（デバウンス500ms）
      let timer: ReturnType<typeof setTimeout> | null = null
      watch(data, () => {
        if (timer) clearTimeout(timer)
        timer = setTimeout(() => saveToStorage(cid, data.value), 500)
      }, { deep: true })
      journalCache.set(cid, data)
    }
    return journalCache.get(cid)!
  }

  // キャッシュのrefを直接返す（コピーではなく同一参照）
  // → 全コンポーネントが同じrefを共有 → データ一致が保証される
  return {
    journals: getOrCreate(clientId.value),
  }
}
