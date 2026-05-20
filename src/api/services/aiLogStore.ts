/**
 * aiLogStore.ts — AIコマンド操作ログ・会話履歴・コスト管理JSON永続化ストア
 *
 * 【設計原則】
 * - サーバー側のインメモリ + JSONファイル永続化（activityLogStore.tsと同パターン）
 * - 起動時にJSONから読み込み
 * - 型は repositories/types.ts から一元参照（二重定義禁止）
 * - Supabase移行時にDB操作に差し替え
 *
 * 【ファイル場所】
 * - data/ai-command-logs.json（操作ログ）
 * - data/ai-chat-sessions.json（会話履歴）
 * - data/ai-cost-limits.json（コスト上限設定）
 *
 * 【2つの役割】（35_ai_command_design.md §2-9）
 * - 役割1: 再実行可能ログ（ナレッジ共有）— ワンクリック再実行
 * - 役割2: WRITE操作の修復ログ（安全網）— Geminiミス時の取消・差戻し
 *
 * 準拠: load_context.md L130: ロジックはAPI側に書け
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import crypto from 'crypto';
import type {
  AiCommandLog,
  AiChatSession,
  AiChatMessage,
  AiCostRecord,
  AiCostLimit,
  AiCostCategory,
} from '../../repositories/types';

const DATA_DIR = join(process.cwd(), 'data');
const LOGS_FILE = join(DATA_DIR, 'ai-command-logs.json');
const SESSIONS_FILE = join(DATA_DIR, 'ai-chat-sessions.json');
const COST_LIMITS_FILE = join(DATA_DIR, 'ai-cost-limits.json');

// ============================================================
// インメモリストア
// ============================================================

let commandLogs: AiCommandLog[] = [];
let chatSessions: AiChatSession[] = [];
let costLimits: AiCostLimit[] = [
  // デフォルト: 無制限
  { category: 'journal_operation', monthlyRequestLimit: 0, monthlyCostLimitYen: 0 },
  { category: 'mcp_query', monthlyRequestLimit: 0, monthlyCostLimitYen: 0 },
];

// ============================================================
// 永続化ユーティリティ
// ============================================================

/** ランダムID生成（既存パターン踏襲） */
function generateId(prefix: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = crypto.randomBytes(8);
  let id = `${prefix}_`;
  for (let i = 0; i < 8; i++) {
    id += chars[bytes[i]! % chars.length];
  }
  return id;
}

function ensureDataDir(): void {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

function saveFile(path: string, data: unknown): void {
  try {
    ensureDataDir();
    writeFileSync(path, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`[aiLogStore] JSON書き出しエラー (${path}):`, err);
  }
}

function loadFile<T>(path: string, fallback: T): T {
  try {
    if (existsSync(path)) {
      const raw = readFileSync(path, 'utf-8');
      return JSON.parse(raw) as T;
    }
  } catch (err) {
    console.error(`[aiLogStore] JSON読み込みエラー (${path}):`, err);
  }
  return fallback;
}

// ============================================================
// 初期化
// ============================================================

/** 起動時にJSONから読み込み */
export function loadAiLogStore(): void {
  commandLogs = loadFile<AiCommandLog[]>(LOGS_FILE, []);
  chatSessions = loadFile<AiChatSession[]>(SESSIONS_FILE, []);
  costLimits = loadFile<AiCostLimit[]>(COST_LIMITS_FILE, costLimits);
  console.log(`[aiLogStore] 読み込み完了: 操作ログ${commandLogs.length}件, 会話${chatSessions.length}件`);
}

// ============================================================
// 操作ログ（§2-9: 再実行 + WRITE修復の2役割）
// ============================================================

/** 操作ログ1件追加 */
export function addCommandLog(
  entry: Omit<AiCommandLog, 'id' | 'executedAt'>
): AiCommandLog {
  const newLog: AiCommandLog = {
    id: generateId('ailog'),
    executedAt: new Date().toISOString(),
    ...entry,
  };
  commandLogs.push(newLog);
  saveFile(LOGS_FILE, commandLogs);
  return newLog;
}

/** 操作ログ全件取得（新しい順） */
export function getAllCommandLogs(): AiCommandLog[] {
  return [...commandLogs].reverse();
}

/** 操作ログ1件取得 */
export function getCommandLogById(id: string): AiCommandLog | undefined {
  return commandLogs.find(l => l.id === id);
}

/** スタッフ別操作ログ取得 */
export function getCommandLogsByStaff(staffId: string): AiCommandLog[] {
  return commandLogs.filter(l => l.staffId === staffId).reverse();
}

/** WRITE操作のみ取得（修復対象候補） */
export function getWriteCommandLogs(): AiCommandLog[] {
  return commandLogs
    .filter(l => l.writeConfirmed === true && l.status === 'success')
    .reverse();
}

// ============================================================
// 会話履歴（§2-4: スタッフ全員で共有）
// ============================================================

/** 新規セッション作成 */
export function createChatSession(staffId: string): AiChatSession {
  const now = new Date().toISOString();
  const session: AiChatSession = {
    id: generateId('aichat'),
    staffId,
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
  chatSessions.push(session);
  saveFile(SESSIONS_FILE, chatSessions);
  return session;
}

/** セッションにメッセージ追加 */
export function addMessageToSession(
  sessionId: string,
  message: Omit<AiChatMessage, 'id' | 'timestamp'>
): AiChatMessage | null {
  const session = chatSessions.find(s => s.id === sessionId);
  if (!session) return null;

  const newMessage: AiChatMessage = {
    id: generateId('aimsg'),
    timestamp: new Date().toISOString(),
    ...message,
  };
  session.messages.push(newMessage);
  session.updatedAt = newMessage.timestamp;
  saveFile(SESSIONS_FILE, chatSessions);
  return newMessage;
}

/** セッション1件取得 */
export function getChatSession(sessionId: string): AiChatSession | undefined {
  return chatSessions.find(s => s.id === sessionId);
}

/** 全セッション取得（新しい順。スタッフ全員共有） */
export function getAllChatSessions(): AiChatSession[] {
  return [...chatSessions].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

// ============================================================
// コスト管理（§2-7: 仕訳操作 vs MCP質問の2分類）
// ============================================================

/** 今月のYYYY-MM文字列を取得 */
function getCurrentYearMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/** 今月のコスト集計（操作ログから算出） */
export function getMonthlyCost(category: AiCostCategory): AiCostRecord {
  const yearMonth = getCurrentYearMonth();
  const monthLogs = commandLogs.filter(l => {
    return l.costCategory === category && l.executedAt.startsWith(yearMonth);
  });

  return {
    yearMonth,
    category,
    requestCount: monthLogs.length,
    // TODO: 実際のトークン数・費用はAI応答のメタデータから取得する。現在は0
    estimatedCostYen: 0,
    promptTokens: 0,
    completionTokens: 0,
  };
}

/** 両分類のコスト取得 */
export function getAllMonthlyCosts(): AiCostRecord[] {
  return [
    getMonthlyCost('journal_operation'),
    getMonthlyCost('mcp_query'),
  ];
}

/** コスト上限設定を取得 */
export function getCostLimits(): AiCostLimit[] {
  return [...costLimits];
}

/** コスト上限設定を更新 */
export function updateCostLimit(category: AiCostCategory, limit: Partial<AiCostLimit>): AiCostLimit {
  const existing = costLimits.find(l => l.category === category);
  if (existing) {
    if (limit.monthlyRequestLimit !== undefined) existing.monthlyRequestLimit = limit.monthlyRequestLimit;
    if (limit.monthlyCostLimitYen !== undefined) existing.monthlyCostLimitYen = limit.monthlyCostLimitYen;
  }
  saveFile(COST_LIMITS_FILE, costLimits);
  return existing ?? costLimits[0]!;
}

/** 月額上限チェック（上限超過時にtrue） */
export function isOverLimit(category: AiCostCategory): boolean {
  const limit = costLimits.find(l => l.category === category);
  if (!limit) return false;

  // 上限0 = 無制限
  if (limit.monthlyRequestLimit === 0 && limit.monthlyCostLimitYen === 0) return false;

  const cost = getMonthlyCost(category);

  if (limit.monthlyRequestLimit > 0 && cost.requestCount >= limit.monthlyRequestLimit) return true;
  if (limit.monthlyCostLimitYen > 0 && cost.estimatedCostYen >= limit.monthlyCostLimitYen) return true;

  return false;
}

// ============================================================
// 起動時に自動読み込み
// ============================================================

loadAiLogStore();
