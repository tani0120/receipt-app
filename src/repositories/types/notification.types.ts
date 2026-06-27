/**
 * 通知（AppNotification）ドメイン型定義
 *
 * 分割元: repositories/types.ts §AppNotification
 * 用途: ナビバーの🔔アイコン + 通知センタードロワー
 */

/** 通知の種別 */
export type NotificationType =
  | 'migration_complete'    // 移行完了（Drive→ローカル移行ジョブ完了）
  | 'migration_failed'      // 移行失敗
  | 'batch_complete'        // バッチ処理完了（将来拡張）
  | 'error'                 // エラー通知（将来拡張）
  | 'mention'               // @メンション通知

/**
 * アプリ通知（通知センターに表示される1件の通知）
 *
 * 対象データ: バックグラウンド処理の完了/失敗通知
 * 用途: ナビバーの🔔アイコン + 通知センタードロワー
 * Supabase移行時: notifications テーブル（id, type, title, body, ...）
 */
export interface AppNotification {
  /** 一意ID（UUID） */
  id: string
  /** 通知種別 */
  type: NotificationType
  /** 通知タイトル（例: 「TST-00011 移行完了」） */
  title: string
  /** 通知本文（例: 「5件移行完了。1件失敗。」） */
  body: string
  /** 既読スタッフIDリスト（スタッフごとの既読管理） */
  readBy: string[]
  /** 作成日時（ISO 8601） */
  createdAt: string
  /** 関連する顧問先ID（任意。顧問先に紐づく通知の場合） */
  clientId?: string
  /** 関連するジョブID（任意。移行ジョブ通知の場合） */
  jobId?: string
  /**
   * アクション（任意。通知に紐づく操作）
   * 例: { label: '仕訳外ZIP DL', url: '/api/drive/download-excluded/TST-00011' }
   */
  action?: {
    /** アクションボタンのラベル */
    label: string
    /** 遷移先URL or APIエンドポイント */
    url: string
  }
  /** 通知の宛先スタッフUUID（メンション等、特定ユーザー宛の通知。未設定=全体通知） */
  targetStaffId?: string
}
