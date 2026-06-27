/**
 * スタッフ（Staff）ドメイン型定義
 *
 * 分割元: repositories/types.ts §0-1
 * 用途: ログイン認証、顧問先担当者紐付け、仕訳画面のスタッフ切替
 */

/** スタッフのロール（役割） */
export type StaffRole = 'admin' | 'general'

/** スタッフのステータス（状態） */
export type StaffStatus = 'active' | 'inactive' | 'suspension'

/**
 * スタッフ（一覧・詳細で共通利用）
 *
 * 対象データ: 事務所スタッフ（ログインユーザー）
 * 用途: ログイン認証、顧問先担当者紐付け、仕訳画面のスタッフ切替
 */
export interface Staff {
  uuid: string
  name: string
  /** ローマ字名（メンション検索用） */
  nameRomaji?: string
  email: string
  // passwordはサーバーサイドのみ。フロントエンドには返らない
  role: StaffRole
  status: StaffStatus
}

/** パネルフォーム用型（Staffからuuidを除外、新規登録時のみパスワード入力） */
export interface StaffForm {
  name: string
  /** ローマ字名（メンション検索用） */
  nameRomaji: string
  email: string
  password: string    // 新規登録・パスワード変更時のみ使用
  role: StaffRole
  status: StaffStatus
}
