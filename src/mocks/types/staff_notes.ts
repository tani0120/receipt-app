/**
 * スタッフノート型定義
 *
 * 目的: コメントモーダルの4カテゴリ対応情報を型安全に管理
 * 準拠: implementation_plan.md
 *
 * Phase A: フィクスチャ直書き + モック内で使用
 * Phase B TODO:
 *   - journal_staff_notes テーブル DDL（migration.sql）
 *   - REMINDER ラベル追加（ENUM/CHECK制約）
 *   - DB trigger: sync_labels_from_staff_notes() 自動同期
 *   - API: staff_notes CRUD エンドポイント追加
 *   - Supabase RLS: staff_notes アクセス制御
 *   - API層ガード: NEED_*系4つのlabels直接操作禁止
 */

/** スタッフノートのキー（4カテゴリ） */
export type StaffNoteKey = 'NEED_DOCUMENT' | 'NEED_INFO' | 'REMINDER' | 'NEED_CONSULT'

/** 個別スタッフノート */
export type StaffNote = {
    enabled: boolean
    text: string
    chatworkUrl: string
}

/** スタッフノート全体（4カテゴリ固定） */
export type StaffNotes = Record<StaffNoteKey, StaffNote>

/** スタッフノートキー一覧（同期関数で使用） */
export const STAFF_NOTE_KEYS: readonly StaffNoteKey[] = [
    'NEED_DOCUMENT',
    'NEED_INFO',
    'REMINDER',
    'NEED_CONSULT',
] as const

/** 空のスタッフノートを生成 */
export function createEmptyStaffNotes(): StaffNotes {
    return {
        NEED_DOCUMENT: { enabled: false, text: '', chatworkUrl: '' },
        NEED_INFO: { enabled: false, text: '', chatworkUrl: '' },
        REMINDER: { enabled: false, text: '', chatworkUrl: '' },
        NEED_CONSULT: { enabled: false, text: '', chatworkUrl: '' },
    }
}

/** スタッフノートキーの日本語ラベル */
export const STAFF_NOTE_LABELS: Record<StaffNoteKey, { label: string; icon: string; section: string }> = {
    NEED_DOCUMENT: { label: '書類が不足', icon: 'fa-file-circle-exclamation', section: '顧問先に確認' },
    NEED_INFO: { label: '情報が不足', icon: 'fa-circle-question', section: '顧問先に確認' },
    REMINDER: { label: '備忘メモ', icon: 'fa-thumbtack', section: '社内で確認' },
    NEED_CONSULT: { label: '社内相談する', icon: 'fa-comments', section: '社内で確認' },
}
