/**
 * useActivityTracker.ts — ページ別活動時間トラッキング
 *
 * 【機能】
 * - ページ遷移時に自動で計測開始/終了
 * - アイドル検出: 5分間操作なし → タイマー停止
 * - clientIdをURLパラメータから自動取得
 * - ページ離脱/ルート変更時にAPIへ記録送信
 * - 除外ページは自動スキップ
 *
 * 【使い方】
 * ルーターガード（afterEach/beforeEach）で自動適用。
 * 各コンポーネントへの個別組み込みは不要。
 *
 * 準拠: DL-042
 */

import type { TrackablePage } from '@/repositories/types';

// ============================================================
// 定数
// ============================================================

/** アイドル検出閾値（ミリ秒） — 5分 */
const IDLE_TIMEOUT_MS = 5 * 60 * 1000;

/** 最小記録閾値（ミリ秒） — 3秒未満は記録しない */
const MIN_ACTIVE_MS = 3000;

/** 計測対象ページのマッピング（パスのプレフィックス → ページ種別） */
const TRACKABLE_PAGES: Record<string, TrackablePage> = {
  '/journal-list/': 'journal-list',
  '/drive-select/': 'drive-select',
  '/output/': 'output',
  '/export-history/': 'export-history',
  '/export/': 'export',
};

/** 暫定ログインスタッフID（Supabase Auth移行時に差し替え） */
const CURRENT_STAFF_ID = 'staff-0000';

// ============================================================
// 内部状態
// ============================================================

let currentSession: {
  staffId: string;
  clientId: string;
  page: TrackablePage;
  startedAt: Date;
  activeMs: number;
  idleMs: number;
  lastActivityAt: number;
  isIdle: boolean;
  idleStartedAt: number | null;
} | null = null;

let idleCheckTimer: ReturnType<typeof setInterval> | null = null;

// ============================================================
// ユーザー操作検出
// ============================================================

function onUserActivity(): void {
  if (!currentSession) return;

  const now = Date.now();

  // アイドル状態から復帰
  if (currentSession.isIdle && currentSession.idleStartedAt) {
    currentSession.idleMs += now - currentSession.idleStartedAt;
    currentSession.isIdle = false;
    currentSession.idleStartedAt = null;
  }

  currentSession.lastActivityAt = now;
}

/** アイドル状態を定期チェック（1秒ごと） */
function checkIdle(): void {
  if (!currentSession || currentSession.isIdle) return;

  const elapsed = Date.now() - currentSession.lastActivityAt;
  if (elapsed >= IDLE_TIMEOUT_MS) {
    currentSession.isIdle = true;
    currentSession.idleStartedAt = Date.now();
  }
}

// ============================================================
// イベントリスナー管理
// ============================================================

const ACTIVITY_EVENTS = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'] as const;

function attachListeners(): void {
  for (const ev of ACTIVITY_EVENTS) {
    document.addEventListener(ev, onUserActivity, { passive: true });
  }
  // ページ離脱時に記録送信
  window.addEventListener('beforeunload', handleBeforeUnload);
}

function detachListeners(): void {
  for (const ev of ACTIVITY_EVENTS) {
    document.removeEventListener(ev, onUserActivity);
  }
  window.removeEventListener('beforeunload', handleBeforeUnload);
}

function handleBeforeUnload(): void {
  stopTracking();
}

// ============================================================
// パス解析
// ============================================================

/** URLパスから計測対象ページ情報を抽出 */
function parseTrackablePath(path: string): { page: TrackablePage; clientId: string } | null {
  for (const [prefix, page] of Object.entries(TRACKABLE_PAGES)) {
    if (path.startsWith(prefix)) {
      const segments = path.slice(prefix.length).split('/');
      const clientId = (segments[0] ?? '').split('?')[0];
      if (clientId) {
        return { page, clientId };
      }
    }
  }
  return null;
}

// ============================================================
// トラッキング制御（公開API）
// ============================================================

/** 計測開始（ルート変更後に呼び出し） */
export function startTracking(path: string): void {
  // 前回セッションが残っていれば終了
  if (currentSession) {
    stopTracking();
  }

  const parsed = parseTrackablePath(path);
  if (!parsed) return; // 計測対象外

  const now = Date.now();
  currentSession = {
    staffId: CURRENT_STAFF_ID,
    clientId: parsed.clientId,
    page: parsed.page,
    startedAt: new Date(),
    activeMs: 0,
    idleMs: 0,
    lastActivityAt: now,
    isIdle: false,
    idleStartedAt: null,
  };

  attachListeners();
  idleCheckTimer = setInterval(checkIdle, 1000);
}

/** 計測停止＆API送信（ルート離脱時に呼び出し） */
export function stopTracking(): void {
  if (!currentSession) return;

  // 最後のアイドル時間を加算
  if (currentSession.isIdle && currentSession.idleStartedAt) {
    currentSession.idleMs += Date.now() - currentSession.idleStartedAt;
  }

  const endedAt = new Date();
  const totalMs = endedAt.getTime() - currentSession.startedAt.getTime();
  const activeMs = totalMs - currentSession.idleMs;

  // クリーンアップ
  detachListeners();
  if (idleCheckTimer) {
    clearInterval(idleCheckTimer);
    idleCheckTimer = null;
  }

  // 最小閾値チェック（3秒未満は記録しない）
  if (activeMs >= MIN_ACTIVE_MS) {
    const payload = {
      staffId: currentSession.staffId,
      clientId: currentSession.clientId,
      page: currentSession.page,
      startedAt: currentSession.startedAt.toISOString(),
      endedAt: endedAt.toISOString(),
      activeMs: Math.max(0, activeMs),
      idleMs: currentSession.idleMs,
    };

    // navigator.sendBeaconでページ離脱時も確実に送信
    const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
    const sent = navigator.sendBeacon('/api/activity-log', blob);
    if (!sent) {
      // フォールバック: fetch（ベストエフォート）
      fetch('/api/activity-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {
        // ネットワークエラーは無視（ログ欠損は許容）
      });
    }
  }

  currentSession = null;
}

/** 現在計測中かどうか */
export function isTracking(): boolean {
  return currentSession !== null;
}
