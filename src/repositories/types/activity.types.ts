/**
 * 活動ログ（ActivityLog）ドメイン型定義
 *
 * 分割元: repositories/types.ts §9
 * 用途: ページ別処理時間トラッキング
 */

/** 計測対象ページ種別 */
export type TrackablePage =
  | 'journal-list'   // 仕訳一覧
  | 'drive-select'   // Drive選別
  | 'output'         // 出力
  | 'export'         // エクスポート
  | 'export-history' // エクスポート履歴

/**
 * 活動ログ1件
 *
 * ログインスタッフの各ページ滞在時間を記録。
 * アイドル検出（5分無操作→タイマー停止）で放置時間を除外。
 */
export interface ActivityLog {
  /** 一意ID（例: act-1714500000000-abc123） */
  id: string
  /** ログインスタッフID（例: staff-0000） */
  staffId: string
  /** 顧問先ID（URLパラメータから取得。例: c_rODnkCDN） */
  clientId: string
  /** ページ種別 */
  page: TrackablePage
  /** 計測開始日時（ISO8601） */
  startedAt: string
  /** 計測終了日時（ISO8601） */
  endedAt: string
  /** アイドル除外後の実稼働ミリ秒 */
  activeMs: number
  /** アイドル時間（ミリ秒） */
  idleMs: number
}

/** スタッフ別活動集計 */
export interface StaffActivitySummary {
  /** スタッフID */
  staffId: string
  /** 合計実稼働ミリ秒 */
  totalActiveMs: number
  /** 合計アイドルミリ秒 */
  totalIdleMs: number
  /** セッション数 */
  sessionCount: number
  /** ページ別実稼働ミリ秒 */
  byPage: Record<string, number>
}

/** 顧問先別活動集計 */
export interface ClientActivitySummary {
  /** 顧問先ID */
  clientId: string
  /** 合計実稼働ミリ秒 */
  totalActiveMs: number
  /** 合計アイドルミリ秒 */
  totalIdleMs: number
  /** セッション数 */
  sessionCount: number
  /** ページ別実稼働ミリ秒 */
  byPage: Record<string, number>
}
