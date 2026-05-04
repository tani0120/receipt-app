/**
 * clientStore.ts — 顧問先JSON永続化ストア
 *
 * 【設計原則】
 * - サーバー側のインメモリ + JSONファイル永続化
 * - 起動時にJSONから読み込み。JSONが存在しなければ初期シードを投入
 * - Supabase移行時にDB操作に差し替え
 * - 型はrepositories/types.tsから一元参照（二重定義禁止）
 *
 * 【ファイル場所】
 * - data/clients.json（.gitignoreに追加済み）
 *
 * 準拠: DL-042
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import type { Client, ClientStatus } from '../../repositories/types';

const DATA_DIR = join(process.cwd(), 'data');
const DATA_FILE = join(DATA_DIR, 'clients.json');

// インメモリストア
let clients: Client[] = [];

// ============================================================
// 永続化
// ============================================================

function save(): void {
  try {
    if (!existsSync(DATA_DIR)) {
      mkdirSync(DATA_DIR, { recursive: true });
    }
    writeFileSync(DATA_FILE, JSON.stringify(clients, null, 2), 'utf-8');
  } catch (err) {
    console.error('[clientStore] JSON書き出しエラー:', err);
  }
}

/** 起動時にJSONから読み込み。なければ空配列で初期化 */
export function loadClients(): void {
  try {
    if (existsSync(DATA_FILE)) {
      const raw = readFileSync(DATA_FILE, 'utf-8');
      clients = JSON.parse(raw) as Client[];
      console.log(`[clientStore] ${clients.length}件をJSONから読み込み`);
    } else {
      clients = [];
      save();
      console.log('[clientStore] JSONなし。空配列で初期化');
    }
  } catch (err) {
    console.error('[clientStore] JSON読み込みエラー:', err);
    clients = [];
  }
}

// ============================================================
// 基本CRUD
// ============================================================

/** 全件取得 */
export function getAll(): Client[] {
  return [...clients];
}

/** clientIdで1件取得 */
export function getById(clientId: string): Client | undefined {
  return clients.find(c => c.clientId === clientId);
}

/** 3文字コードで検索 */
export function getByThreeCode(code: string): Client | undefined {
  return clients.find(c => c.threeCode.toUpperCase() === code.toUpperCase());
}

/** 1件追加 */
export function create(client: Client): Client {
  clients.push(client);
  save();
  console.log(`[clientStore] 追加: ${client.companyName} (${client.clientId})`);
  return client;
}

/** 部分更新 */
export function updateClient(clientId: string, partial: Partial<Client>): boolean {
  const idx = clients.findIndex(c => c.clientId === clientId);
  if (idx < 0) return false;
  clients[idx] = { ...clients[idx], ...partial, clientId } as Client; // clientIdは不変
  save();
  return true;
}

/** ステータス更新 */
export function updateStatus(clientId: string, status: ClientStatus): boolean {
  return updateClient(clientId, { status });
}

/** 件数取得 */
export function count(): number {
  return clients.length;
}

// ============================================================
// 仕訳システム固有
// ============================================================

/** 担当者別顧問先取得（進捗管理フィルタ） */
export function getByStaffId(staffId: string): Client[] {
  return clients.filter(c => c.staffId === staffId);
}

/** 有効顧問先のみ取得 */
export function getActiveClients(): Client[] {
  return clients.filter(c => c.status === 'active');
}

/** 担当者変更 */
export function updateStaffAssignment(clientId: string, staffId: string | null): boolean {
  return updateClient(clientId, { staffId });
}

/** Drive共有フォルダ設定 */
export function updateSharedFolderId(clientId: string, folderId: string): boolean {
  return updateClient(clientId, { sharedFolderId: folderId });
}

/** 顧問先メール設定 */
export function updateSharedEmail(clientId: string, email: string): boolean {
  return updateClient(clientId, { sharedEmail: email });
}

/** ステータス別取得 */
export function getByStatus(status: ClientStatus): Client[] {
  return clients.filter(c => c.status === status);
}

/** 会計ソフト別取得 */
export function getByAccountingSoftware(sw: string): Client[] {
  return clients.filter(c => c.accountingSoftware === sw);
}

/** 新しいclientIdを生成（既存の最大連番+1） */
export function createClientId(threeCode: string): string {
  let maxSeq = 0;
  for (const c of clients) {
    const dash = c.clientId.indexOf('-');
    if (dash >= 0) {
      const seq = parseInt(c.clientId.substring(dash + 1), 10);
      if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
    }
  }
  const nextSeq = String(maxSeq + 1).padStart(5, '0');
  return `${threeCode}-${nextSeq}`;
}

// 起動時に自動読み込み
loadClients();
