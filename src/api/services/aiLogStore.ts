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
// コスト管理（§2-7: 実データ集計）
// ============================================================

/** 今月のYYYY-MM文字列を取得 */
function getCurrentYearMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/** 指定年月のログをフィルタ */
function filterByYearMonth(yearMonth: string): AiCommandLog[] {
  return commandLogs.filter(l => l.executedAt.startsWith(yearMonth));
}

/** ログ配列からコスト集計 */
function aggregateCost(logs: AiCommandLog[], yearMonth: string, category?: AiCostCategory): AiCostRecord {
  const filtered = category ? logs.filter(l => l.costCategory === category) : logs;
  return {
    yearMonth,
    category: category ?? 'mcp_query',
    requestCount: filtered.length,
    estimatedCostYen: filtered.reduce((sum, l) => sum + (l.estimatedCostYen ?? 0), 0),
    promptTokens: filtered.reduce((sum, l) => sum + (l.promptTokens ?? 0), 0),
    completionTokens: filtered.reduce((sum, l) => sum + (l.completionTokens ?? 0), 0),
  };
}

/** 今月のコスト集計（カテゴリ別） */
export function getMonthlyCost(category: AiCostCategory): AiCostRecord {
  const yearMonth = getCurrentYearMonth();
  return aggregateCost(filterByYearMonth(yearMonth), yearMonth, category);
}

/** 今月の全コスト集計（カテゴリ横断） */
export function getMonthlyTotalCost(): AiCostRecord {
  const yearMonth = getCurrentYearMonth();
  const logs = filterByYearMonth(yearMonth);
  const result = aggregateCost(logs, yearMonth);
  result.requestCount = logs.length;
  return result;
}

/** 両分類のコスト取得 */
export function getAllMonthlyCosts(): AiCostRecord[] {
  return [
    getMonthlyCost('journal_operation'),
    getMonthlyCost('mcp_query'),
  ];
}

/** スタッフ別コスト集計結果 */
export interface StaffCostSummary {
  staffId: string
  requestCount: number
  promptTokens: number
  completionTokens: number
  thinkingTokens: number
  totalTokens: number
  estimatedCostYen: number
}

/** スタッフ別の今月コスト集計 */
export function getStaffMonthlyCosts(): StaffCostSummary[] {
  const yearMonth = getCurrentYearMonth();
  const logs = filterByYearMonth(yearMonth);

  const map = new Map<string, StaffCostSummary>();
  for (const l of logs) {
    const key = l.staffId || 'unknown';
    const existing = map.get(key) ?? {
      staffId: key,
      requestCount: 0,
      promptTokens: 0,
      completionTokens: 0,
      thinkingTokens: 0,
      totalTokens: 0,
      estimatedCostYen: 0,
    };
    existing.requestCount++;
    existing.promptTokens += l.promptTokens ?? 0;
    existing.completionTokens += l.completionTokens ?? 0;
    existing.thinkingTokens += l.thinkingTokens ?? 0;
    existing.totalTokens += l.totalTokens ?? 0;
    existing.estimatedCostYen += l.estimatedCostYen ?? 0;
    map.set(key, existing);
  }
  return [...map.values()];
}

/** スタッフ別の年間コスト（管理画面staffタブ用） */
export function getStaffAnnualCost(staffId: string): number {
  const year = String(new Date().getFullYear());
  return commandLogs
    .filter(l => l.staffId === staffId && l.executedAt.startsWith(year))
    .reduce((sum, l) => sum + (l.estimatedCostYen ?? 0), 0);
}

/** 顧問先別コスト集計結果 */
export interface ClientCostSummary {
  clientId: string
  requestCount: number
  promptTokens: number
  completionTokens: number
  totalTokens: number
  estimatedCostYen: number
}

/** 顧問先別の今月コスト集計 */
export function getClientMonthlyCosts(): ClientCostSummary[] {
  const yearMonth = getCurrentYearMonth();
  const logs = filterByYearMonth(yearMonth);

  const map = new Map<string, ClientCostSummary>();
  for (const l of logs) {
    const key = l.clientId || 'unknown';
    const existing = map.get(key) ?? {
      clientId: key,
      requestCount: 0,
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      estimatedCostYen: 0,
    };
    existing.requestCount++;
    existing.promptTokens += l.promptTokens ?? 0;
    existing.completionTokens += l.completionTokens ?? 0;
    existing.totalTokens += l.totalTokens ?? 0;
    existing.estimatedCostYen += l.estimatedCostYen ?? 0;
    map.set(key, existing);
  }
  return [...map.values()];
}

/** スタッフ×顧問先クロス集計結果 */
export interface CrossCostSummary {
  staffId: string
  clientId: string
  requestCount: number
  totalTokens: number
  estimatedCostYen: number
}

/** スタッフ×顧問先のクロス集計（今月） */
export function getCrossMonthlyCosts(): CrossCostSummary[] {
  const yearMonth = getCurrentYearMonth();
  const logs = filterByYearMonth(yearMonth);

  const map = new Map<string, CrossCostSummary>();
  for (const l of logs) {
    const key = `${l.staffId || 'unknown'}:${l.clientId || 'unknown'}`;
    const existing = map.get(key) ?? {
      staffId: l.staffId || 'unknown',
      clientId: l.clientId || 'unknown',
      requestCount: 0,
      totalTokens: 0,
      estimatedCostYen: 0,
    };
    existing.requestCount++;
    existing.totalTokens += l.totalTokens ?? 0;
    existing.estimatedCostYen += l.estimatedCostYen ?? 0;
    map.set(key, existing);
  }
  return [...map.values()];
}

/** モデル別集計結果 */
export interface ModelCostSummary {
  model: string
  requestCount: number
  promptTokens: number
  completionTokens: number
  totalTokens: number
  estimatedCostYen: number
  inputPricePerM: number
  outputPricePerM: number
}

/** モデル別コスト集計（今月） */
export function getModelMonthlyCosts(): ModelCostSummary[] {
  const yearMonth = getCurrentYearMonth();
  const logs = filterByYearMonth(yearMonth);

  const map = new Map<string, ModelCostSummary>();
  for (const l of logs) {
    const key = l.model || 'unknown';
    const existing = map.get(key) ?? {
      model: key,
      requestCount: 0,
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      estimatedCostYen: 0,
      inputPricePerM: l.inputPricePerM ?? 0,
      outputPricePerM: l.outputPricePerM ?? 0,
    };
    existing.requestCount++;
    existing.promptTokens += l.promptTokens ?? 0;
    existing.completionTokens += l.completionTokens ?? 0;
    existing.totalTokens += l.totalTokens ?? 0;
    existing.estimatedCostYen += l.estimatedCostYen ?? 0;
    map.set(key, existing);
  }
  return [...map.values()];
}

/** 今年のAIコマンド費用合計（全スタッフ） */
export function getAnnualTotalCost(): number {
  const year = String(new Date().getFullYear());
  return commandLogs
    .filter(l => l.executedAt.startsWith(year))
    .reduce((sum, l) => sum + (l.estimatedCostYen ?? 0), 0);
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
