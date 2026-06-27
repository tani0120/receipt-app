/**
 * 共有設定（ShareStatus）ドメイン型定義
 *
 * 分割元: repositories/types.ts §6
 * 用途: アップロードURL共有のステータス管理
 */

/** 共有設定ステータス */
export type ShareStatus = 'pending' | 'active' | 'revoked'

/** 顧問先ごとの共有設定レコード */
export interface ShareStatusRecord {
  clientId: string
  status: ShareStatus
  /** 招待コード（発行済みの場合） */
  inviteCode: string | null
  /** 最終更新日時（ISO 8601） */
  updatedAt: string
}
