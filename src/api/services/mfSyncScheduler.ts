/**
 * mfSyncScheduler.ts — MF自動取得スケジューラ
 *
 * 指定時刻（デフォルト00:00）にMFデータを自動取得する。
 * 将来、複数の自動取得日時を設定する可能性があるため、
 * スケジュール設定を配列で管理する設計。
 *
 * 【設計方針】
 * - 環境変数 MF_SYNC_SCHEDULE で取得時刻を設定（カンマ区切り、デフォルト "00:00"）
 * - 環境変数 MF_AUTO_SYNC_ENABLED で有効/無効を制御（デフォルト false）
 * - 本番環境（NODE_ENV=production）では自動有効化
 * - node-cronは使わず、setTimeout/setIntervalでシンプルに実装
 */

/** スケジュール設定（HH:MM形式の配列） */
interface MfSyncScheduleConfig {
  /** 自動取得を有効にするか */
  有効: boolean
  /** 取得時刻の配列（HH:MM形式） */
  取得時刻: string[]
}

/** 現在の設定を環境変数から読み込む */
function loadConfig(): MfSyncScheduleConfig {
  const isProduction = process.env.NODE_ENV === 'production'
  const enabled = process.env.MF_AUTO_SYNC_ENABLED === 'true' || isProduction

  const scheduleStr = process.env.MF_SYNC_SCHEDULE || '00:00'
  const 取得時刻 = scheduleStr.split(',').map(s => s.trim()).filter(Boolean)

  return { 有効: enabled, 取得時刻 }
}

/** HH:MM文字列を今日の次の発火時刻のmsに変換 */
function nextFireTime(hhMm: string): number {
  const [h, m] = hhMm.split(':').map(Number)
  const now = new Date()
  const target = new Date(now)
  target.setHours(h!, m!, 0, 0)

  // 既に過ぎていたら明日にする
  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 1)
  }
  return target.getTime() - now.getTime()
}

/** 自動取得を実行する */
async function executeMfSync(): Promise<void> {
  console.log(`[MF自動取得] ${new Date().toISOString()} — 自動取得開始`)
  try {
    // 内部APIを直接呼び出す（サーバー内なのでlocalhost経由）
    const res = await fetch('http://localhost:8080/api/mf/sync-all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(300_000), // 5分タイムアウト
    })

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      console.error(`[MF自動取得] API応答エラー: ${res.status} ${body}`)
      return
    }

    const result = await res.json() as { success?: boolean; message?: string }
    console.log(`[MF自動取得] 完了: ${result.message ?? JSON.stringify(result)}`)
  } catch (err) {
    console.error(`[MF自動取得] 実行失敗:`, err instanceof Error ? err.message : String(err))
  }
}

/** タイマーID管理 */
const activeTimers: ReturnType<typeof setTimeout>[] = []

/** スケジューラを開始する */
export function startMfSyncScheduler(): void {
  const config = loadConfig()

  if (!config.有効) {
    console.log('[MF自動取得] 無効（MF_AUTO_SYNC_ENABLED=true で有効化）')
    return
  }

  console.log(`[MF自動取得] スケジューラ開始 — 取得時刻: ${config.取得時刻.join(', ')}`)

  for (const hhMm of config.取得時刻) {
    scheduleNext(hhMm)
  }
}

/** 次の発火をスケジュールする（1回発火後に自動で次をスケジュール） */
function scheduleNext(hhMm: string): void {
  const delay = nextFireTime(hhMm)
  const fireAt = new Date(Date.now() + delay)
  console.log(`[MF自動取得] 次回: ${hhMm} → ${fireAt.toLocaleString('ja-JP')}（${Math.round(delay / 60_000)}分後）`)

  const timer = setTimeout(async () => {
    await executeMfSync()
    // 次回をスケジュール（翌日の同時刻）
    scheduleNext(hhMm)
  }, delay)

  // Node.jsプロセスの終了を妨げない
  timer.unref()
  activeTimers.push(timer)
}

/** スケジューラを停止する */
export function stopMfSyncScheduler(): void {
  for (const timer of activeTimers) {
    clearTimeout(timer)
  }
  activeTimers.length = 0
  console.log('[MF自動取得] スケジューラ停止')
}
