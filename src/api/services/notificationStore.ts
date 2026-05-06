/**
 * 通知 JSON永続化ストア
 *
 * data/notifications.json に全通知を保存。
 * readBy[] でスタッフごとの既読管理。
 * staffIdフィルタで自分宛+全体通知のみ返却。
 *
 * 準拠: DL-047
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import type { AppNotification } from '../../repositories/types';

const DATA_DIR = join(process.cwd(), 'data');
const FILE_PATH = join(DATA_DIR, 'notifications.json');
const MAX_NOTIFICATIONS = 200;

function ensureDir(): void {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
}

// ============================================================
// 読み書き
// ============================================================

/** 全通知を取得（新しい順） */
export function getAllNotifications(): AppNotification[] {
  if (!existsSync(FILE_PATH)) return [];
  try {
    const raw = JSON.parse(readFileSync(FILE_PATH, 'utf-8')) as unknown[];
    // 旧形式（isRead: boolean）→ 新形式（readBy: string[]）の移行
    return raw.map((n: any) => {
      if ('isRead' in n && !('readBy' in n)) {
        const { isRead, ...rest } = n;
        return { ...rest, readBy: isRead ? ['__migrated__'] : [] } as AppNotification;
      }
      return n as AppNotification;
    });
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
