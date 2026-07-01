/**
 * Repository型定義 — ドメイン型の再公開（re-export）
 *
 * 分割ファイルから全ドメイン型を再公開する。
 * 既存の `import ... from './'` を壊さないためのエントリポイント。
 */

// ── ドメイン型（分割ファイルから再公開） ──
export type { Staff, StaffForm, StaffRole, StaffStatus } from './staff.types'
export type { Client, ClientForm, ClientStatus, ClientContact, PastStaffEntry, AttachmentFile } from './client.types'
export type { Lead, LeadForm, LeadStatus } from './lead.types'
export type { DocEntry, DocSource, DocStatus } from './doc-entry.types'
export { AI_FIELD_KEYS } from './doc-entry.types'
export type { AppNotification, NotificationType } from './notification.types'
export type { ActivityLog, StaffActivitySummary, ClientActivitySummary, TrackablePage } from './activity.types'
export type { ShareStatus, ShareStatusRecord } from './share-status.types'
export type {
  AiCostCategory, AiCommandLog, AiCommandContext,
  AiChatMessage, AiActionButton, AiChatSession,
  AiCostRecord, AiCostLimit
} from './ai-command.types'
