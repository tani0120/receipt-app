import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { z } from 'zod';
import type { AppNotification } from '../../repositories/types';

const DATA_DIR = join(process.cwd(), 'data');
const FILE_PATH = join(DATA_DIR, 'notifications.json');
const MAX_NOTIFICATIONS = 200;

function ensureDir(): void {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
}

// ============================================================
// zodスキーマ（JSON永続化境界のバリデーション）
// ============================================================

/** 旧形式(isRead)→新形式(readBy)のマイグレーション付きスキーマ */
const AppNotificationSchema = z.object({
  id: z.string(),
  type: z.enum(['migration_complete', 'migration_failed', 'batch_complete', 'error', 'mention']),
  title: z.string(),
  body: z.string(),
  readBy: z.array(z.string()).default([]),
  createdAt: z.string(),
  clientId: z.string().optional(),
  jobId: z.string().optional(),
  action: z.object({
    label: z.string(),
    url: z.string(),
  }).optional(),
  targetStaffId: z.string().optional(),
}).passthrough()

import { isRecord } from '../../utils/typeGuards';

/** 旧形式（isRead: boolean）を新形式（readBy: string[]）に前処理 */
function migrateNotificationData(item: unknown): unknown {
  if (!isRecord(item)) return item
  if ('isRead' in item && !('readBy' in item)) {
    const { isRead, ...rest } = item
    return { ...rest, readBy: isRead ? ['__migrated__'] : [] }
  }
  return item
}

// ============================================================
// 読み書き
// ============================================================

/** 全通知を取得（新しい順） */
export function getAllNotifications(): AppNotification[] {
  if (!existsSync(FILE_PATH)) return [];
  try {
    const raw: unknown = JSON.parse(readFileSync(FILE_PATH, 'utf-8'));
    if (!Array.isArray(raw)) return [];
    const results: AppNotification[] = [];
    for (const item of raw) {
      const migrated = migrateNotificationData(item);
      const parsed = AppNotificationSchema.safeParse(migrated);
      if (parsed.success) {
        results.push(parsed.data);
      }
      // バリデーション失敗 → 不正データとしてスキップ（サイレント）
    }
    return results;
  } catch {
    return [];
  }
}

/** 通知を保存（全件上書き） */
function saveAll(notifications: AppNotification[]): void {
  ensureDir();
  writeFileSync(FILE_PATH, JSON.stringify(notifications, null, 2), 'utf-8');
}

// ============================================================
// スタッフ別フィルタ取得
// ============================================================

/**
 * 指定スタッフ宛の通知を取得
 * - targetStaffId === staffId（自分宛のメンション等）
 * - targetStaffId が未設定（全体通知: 移行完了等）
 */
export function getNotificationsForStaff(staffId: string): AppNotification[] {
  const all = getAllNotifications();
  return all.filter(n =>
    !n.targetStaffId || n.targetStaffId === staffId
  );
}

// ============================================================
// 作成・更新・削除
// ============================================================

/** 通知を追加（先頭に挿入、最大件数制限） */
export function addNotification(notification: AppNotification): void {
  const all = getAllNotifications();
  all.unshift(notification);
  if (all.length > MAX_NOTIFICATIONS) {
    all.length = MAX_NOTIFICATIONS;
  }
  saveAll(all);
}

/** 指定スタッフが通知を既読にする */
export function markAsRead(id: string, staffId: string): boolean {
  const all = getAllNotifications();
  const target = all.find(n => n.id === id);
  if (!target) return false;
  if (!target.readBy.includes(staffId)) {
    target.readBy.push(staffId);
  }
  saveAll(all);
  return true;
}

/** 指定スタッフが全通知を既読にする */
export function markAllAsRead(staffId: string): void {
  const all = getAllNotifications();
  for (const n of all) {
    if (!n.readBy.includes(staffId)) {
      n.readBy.push(staffId);
    }
  }
  saveAll(all);
}

/** 通知を削除 */
export function deleteNotification(id: string): boolean {
  const all = getAllNotifications();
  const idx = all.findIndex(n => n.id === id);
  if (idx === -1) return false;
  all.splice(idx, 1);
  saveAll(all);
  return true;
}

/** 全通知を削除 */
export function clearAllNotifications(): void {
  saveAll([]);
}
