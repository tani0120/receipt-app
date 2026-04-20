/**
 * shareStatusStore.ts — 共有設定JSON永続化ストア
 *
 * 【設計原則】
 * - サーバー側のインメモリ + JSONファイル永続化
 * - 起動時にJSONから読み込み、更新時にJSONに書き出し
 * - Supabase移行時にDB操作に差し替え
 * - 型はrepositories/types.tsから一元参照（二重定義禁止）
 *
 * 【ファイル場所】
 * - data/share_status.json（.gitignoreに追加済み）
 *
 * 【用途】
 * - 招待コード→clientId逆引き（別ブラウザ/デバイスから）
 * - 共有ステータス管理（pending/active/revoked）
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import type { ShareStatusRecord, ShareStatus } from '../../repositories/types';

const DATA_DIR = join(process.cwd(), 'data');
const DATA_FILE = join(DATA_DIR, 'share_status.json');

// インメモリストア
let records: ShareStatusRecord[] = [];

/**
 * 起動時にJSONから読み込み
 */
export function loadShareStatus(): void {
  try {
    if (existsSync(DATA_FILE)) {
      const raw = readFileSync(DATA_FILE, 'utf-8');
      records = JSON.parse(raw) as ShareStatusRecord[];
      console.log(`[shareStatusStore] ${records.length}件をJSONから読み込み`);
    } else {
      records = [];
      console.log('[shareStatusStore] JSONファイルなし。空で起動');
    }
  } catch (err) {
    console.error('[shareStatusStore] JSON読み込みエラー:', err);
    records = [];
  }
}

/**
 * JSONに書き出し（同期。データ量が小さいため問題なし）
 */
function save(): void {
  try {
    if (!existsSync(DATA_DIR)) {
      mkdirSync(DATA_DIR, { recursive: true });
    }
    writeFileSync(DATA_FILE, JSON.stringify(records, null, 2), 'utf-8');
  } catch (err) {
    console.error('[shareStatusStore] JSON書き出しエラー:', err);
  }
}

/**
 * 全件取得
 */
export function getAllShareStatus(): ShareStatusRecord[] {
  return [...records];
}

/**
 * clientIdで1件取得
 */
export function getByClientId(clientId: string): ShareStatusRecord | undefined {
  return records.find(r => r.clientId === clientId);
}

/**
 * 招待コードからclientIdを逆引き
 */
export function getClientIdByInviteCode(code: string): string | null {
  const rec = records.find(r => r.inviteCode === code);
  return rec?.clientId ?? null;
}

/**
 * ステータス更新（upsert）
 */
export function updateStatus(clientId: string, status: ShareStatus): void {
  const existing = records.find(r => r.clientId === clientId);
  if (existing) {
    existing.status = status;
    existing.updatedAt = new Date().toISOString();
  } else {
    records.push({
      clientId,
      status,
      inviteCode: null,
      updatedAt: new Date().toISOString(),
    });
  }
  save();
}

/**
 * 招待コード保存（upsert）
 */
export function saveInviteCode(clientId: string, code: string): void {
  const existing = records.find(r => r.clientId === clientId);
  if (existing) {
    existing.inviteCode = code;
    existing.updatedAt = new Date().toISOString();
  } else {
    records.push({
      clientId,
      status: 'pending',
      inviteCode: code,
      updatedAt: new Date().toISOString(),
    });
  }
  save();
  console.log(`[shareStatusStore] 招待コード保存: ${clientId} → ${code}`);
}

// 起動時に自動読み込み
loadShareStatus();
