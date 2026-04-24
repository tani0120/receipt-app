/**
 * 通知 JSON永続化ストア
 *
 * data/notifications.json に全通知を保存。
 * 顧問先横断で1ファイル（通知は全体で共有）。
 *
 * 準拠: DL-047（通知永続化。exportHistoryStore.tsと同一パターン）
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

/** 全通知を取得（新しい順） */
export function getAllNotifications(): AppNotification[] {
  if (!existsSync(FILE_PATH)) return [];
  try {
    return JSON.parse(readFileSync(FILE_PATH, 'utf-8')) as AppNotification[];
  } catch {
    return [];
  }
}

/** 通知を保存（全件上書き） */
function saveAll(notifications: AppNotification[]): void {
  ensureDir();
  writeFileSync(FILE_PATH, JSON.stringify(notifications, null, 2), 'utf-8');
}

/** 通知を追加（先頭に挿入、最大件数制限） */
export function addNotification(notification: AppNotification): void {
  const all = getAllNotifications();
  all.unshift(notification);
  // 最大件数制限
  if (all.length > MAX_NOTIFICATIONS) {
    all.length = MAX_NOTIFICATIONS;
  }
  saveAll(all);
}

/** 通知を既読にする */
export function markAsRead(id: string): boolean {
  const all = getAllNotifications();
  const target = all.find(n => n.id === id);
  if (!target) return false;
  target.isRead = true;
  saveAll(all);
  return true;
}

/** 全通知を既読にする */
export function markAllAsRead(): void {
  const all = getAllNotifications();
  for (const n of all) {
    n.isRead = true;
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
