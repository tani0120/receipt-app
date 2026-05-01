/**
 * activityLogRoutes.ts — 活動ログAPIルート
 *
 * 【エンドポイント】
 * POST   /api/activity-log          — ログ1件記録
 * GET    /api/activity-log/summary  — 全体集計（スタッフ別・顧問先別）
 * GET    /api/activity-log/staff/:staffId   — スタッフ別詳細
 * GET    /api/activity-log/client/:clientId — 顧問先別詳細
 *
 * 準拠: DL-042
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { zodHook } from '../helpers/zodHook';
import {
  addLog,
  getByStaff,
  getByClient,
  summarizeByStaff,
  summarizeByClient,
  summarizeCross
} from '../services/activityLogStore';

const app = new Hono();

// ============================================================
// バリデーションスキーマ
// ============================================================

const ActivityLogSchema = z.object({
  /** ログインスタッフID（例: staff-0000） */
  staffId: z.string().min(1, 'staffIdは必須'),
  /** 顧問先ID（例: TST-00011） */
  clientId: z.string().min(1, 'clientIdは必須'),
  /** ページ種別 */
  page: z.enum(['journal-list', 'drive-select', 'output', 'export', 'export-history']),
  /** 計測開始日時（ISO8601） */
  startedAt: z.string(),
  /** 計測終了日時（ISO8601） */
  endedAt: z.string(),
  /** アイドル除外後の実稼働ミリ秒 */
  activeMs: z.number().min(0),
  /** アイドル時間（ミリ秒） */
  idleMs: z.number().min(0),
});

// ============================================================
// ルート定義
// ============================================================

/** ログ1件記録 */
app.post(
  '/',
  zValidator('json', ActivityLogSchema, zodHook),
  (c) => {
    const body = c.req.valid('json');
    const saved = addLog(body);
    return c.json({ success: true, log: saved }, 201);
  }
);

/** 全体集計（スタッフ別 + 顧問先別 + クロス） */
app.get('/summary', (c) => {
  return c.json({
    byStaff: summarizeByStaff(),
    byClient: summarizeByClient(),
    cross: summarizeCross()
  });
});

/** スタッフ別詳細ログ */
app.get('/staff/:staffId', (c) => {
  const staffId = c.req.param('staffId');
  const logs = getByStaff(staffId);
  return c.json({ staffId, logs, count: logs.length });
});

/** 顧問先別詳細ログ */
app.get('/client/:clientId', (c) => {
  const clientId = c.req.param('clientId');
  const logs = getByClient(clientId);
  return c.json({ clientId, logs, count: logs.length });
});

export default app;
