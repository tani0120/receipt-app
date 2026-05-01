/**
 * activityLogStore.ts — 活動ログJSON永続化ストア
 *
 * 【設計原則】
 * - サーバー側のインメモリ + JSONファイル永続化
 * - 起動時にJSONから読み込み
 * - 型は repositories/types.ts から一元参照（二重定義禁止）
 * - Supabase移行時にDB操作に差し替え
 *
 * 【ファイル場所】
 * - data/activity-log.json（.gitignoreに追加済み）
 *
 * 準拠: DL-042
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import type {
  ActivityLog,
  StaffActivitySummary,
  ClientActivitySummary
} from '../../repositories/types';

const DATA_DIR = join(process.cwd(), 'data');
const DATA_FILE = join(DATA_DIR, 'activity-log.json');

// インメモリストア
let logs: ActivityLog[] = [];

// ============================================================
// 永続化
// ============================================================

function save(): void {
  try {
    if (!existsSync(DATA_DIR)) {
      mkdirSync(DATA_DIR, { recursive: true });
    }
    writeFileSync(DATA_FILE, JSON.stringify(logs, null, 2), 'utf-8');
  } catch (err) {
    console.error('[activityLogStore] JSON書き出しエラー:', err);
  }
}

/** 起動時にJSONから読み込み */
export function loadActivityLogs(): void {
  try {
    if (existsSync(DATA_FILE)) {
      const raw = readFileSync(DATA_FILE, 'utf-8');
      logs = JSON.parse(raw) as ActivityLog[];
      console.log(`[activityLogStore] ${logs.length}件をJSONから読み込み`);
    } else {
      logs = [];
      save();
      console.log('[activityLogStore] JSONなし。空のストアを初期化');
    }
  } catch (err) {
    console.error('[activityLogStore] JSON読み込みエラー:', err);
    logs = [];
    save();
  }
}

// ============================================================
// 基本操作
// ============================================================

/** ログ1件追加 */
export function addLog(entry: Omit<ActivityLog, 'id'>): ActivityLog {
  const id = `act-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const newLog: ActivityLog = { id, ...entry };
  logs.push(newLog);
  save();
  return newLog;
}

/** 全件取得 */
export function getAll(): ActivityLog[] {
  return [...logs];
}

/** スタッフID指定で取得 */
export function getByStaff(staffId: string): ActivityLog[] {
  return logs.filter(l => l.staffId === staffId);
}

/** 顧問先ID指定で取得 */
export function getByClient(clientId: string): ActivityLog[] {
  return logs.filter(l => l.clientId === clientId);
}

// ============================================================
// 集計
// ============================================================

/** 今月のログのみ抽出 */
function thisMonthLogs(): ActivityLog[] {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  return logs.filter(l => {
    const d = new Date(l.startedAt);
    return d.getFullYear() === year && d.getMonth() === month;
  });
}

/** スタッフ別集計（今月） */
export function summarizeByStaff(): StaffActivitySummary[] {
  const monthly = thisMonthLogs();
  const map = new Map<string, StaffActivitySummary>();
  for (const l of monthly) {
    let s = map.get(l.staffId);
    if (!s) {
      s = { staffId: l.staffId, totalActiveMs: 0, totalIdleMs: 0, sessionCount: 0, byPage: {} };
      map.set(l.staffId, s);
    }
    s.totalActiveMs += l.activeMs;
    s.totalIdleMs += l.idleMs;
    s.sessionCount++;
    s.byPage[l.page] = (s.byPage[l.page] || 0) + l.activeMs;
  }
  return Array.from(map.values());
}

/** 顧問先別集計（今月） */
export function summarizeByClient(): ClientActivitySummary[] {
  const monthly = thisMonthLogs();
  const map = new Map<string, ClientActivitySummary>();
  for (const l of monthly) {
    let c = map.get(l.clientId);
    if (!c) {
      c = { clientId: l.clientId, totalActiveMs: 0, totalIdleMs: 0, sessionCount: 0, byPage: {} };
      map.set(l.clientId, c);
    }
    c.totalActiveMs += l.activeMs;
    c.totalIdleMs += l.idleMs;
    c.sessionCount++;
    c.byPage[l.page] = (c.byPage[l.page] || 0) + l.activeMs;
  }
  return Array.from(map.values());
}

/** スタッフ×顧問先クロス集計（今月） */
export function summarizeCross(): { staffId: string; clientId: string; totalActiveMs: number }[] {
  const monthly = thisMonthLogs();
  const map = new Map<string, { staffId: string; clientId: string; totalActiveMs: number }>();
  for (const l of monthly) {
    const key = `${l.staffId}:${l.clientId}`;
    const existing = map.get(key);
    if (existing) {
      existing.totalActiveMs += l.activeMs;
    } else {
      map.set(key, { staffId: l.staffId, clientId: l.clientId, totalActiveMs: l.activeMs });
    }
  }
  return Array.from(map.values());
}

// 起動時に自動読み込み
loadActivityLogs();
