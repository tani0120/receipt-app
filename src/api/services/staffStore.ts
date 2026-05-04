/**
 * staffStore.ts — スタッフJSON永続化ストア
 *
 * 【設計原則】
 * - サーバー側のインメモリ + JSONファイル永続化
 * - 起動時にJSONから読み込み。JSONが存在しなければ初期シードを投入
 * - Supabase移行時にDB操作に差し替え
 * - 型はrepositories/types.tsから一元参照（二重定義禁止）
 *
 * 【ファイル場所】
 * - data/staff.json（.gitignoreに追加済み）
 *
 * 準拠: DL-042
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import type { Staff, StaffRole, StaffStatus } from '../../repositories/types';

const DATA_DIR = join(process.cwd(), 'data');
const DATA_FILE = join(DATA_DIR, 'staff.json');

// インメモリストア
let staffList: Staff[] = [];

// ID連番カウンター
let idCounter = 0;

// ============================================================
// 永続化
// ============================================================

function save(): void {
  try {
    if (!existsSync(DATA_DIR)) {
      mkdirSync(DATA_DIR, { recursive: true });
    }
    writeFileSync(DATA_FILE, JSON.stringify(staffList, null, 2), 'utf-8');
  } catch (err) {
    console.error('[staffStore] JSON書き出しエラー:', err);
  }
}

/** 起動時にJSONから読み込み。なければ空配列で初期化 */
export function loadStaff(): void {
  try {
    if (existsSync(DATA_FILE)) {
      const raw = readFileSync(DATA_FILE, 'utf-8');
      staffList = JSON.parse(raw) as Staff[];
      console.log(`[staffStore] ${staffList.length}件をJSONから読み込み`);
    } else {
      staffList = [];
      save();
      console.log('[staffStore] JSONなし。空配列で初期化');
    }
  } catch (err) {
    console.error('[staffStore] JSON読み込みエラー:', err);
    staffList = [];
  }
  // IDカウンターを既存データの最大値に設定
  for (const s of staffList) {
    const match = s.uuid.match(/^staff-(\d+)$/);
    if (match && match[1]) {
      const num = parseInt(match[1], 10);
      if (num > idCounter) idCounter = num;
    }
  }
}

// ============================================================
// 基本CRUD
// ============================================================

/** 全件取得 */
export function getAll(): Staff[] {
  return [...staffList];
}

/** UUIDで1件取得 */
export function getById(uuid: string): Staff | undefined {
  return staffList.find(s => s.uuid === uuid);
}

/** 1件追加 */
export function create(staff: Omit<Staff, 'uuid'> & { uuid?: string }): Staff {
  const uuid = staff.uuid || generateUuid();
  const newStaff: Staff = { ...staff, uuid };
  staffList.push(newStaff);
  save();
  console.log(`[staffStore] 追加: ${newStaff.name} (${uuid})`);
  return newStaff;
}

/** 部分更新 */
export function update(uuid: string, partial: Partial<Staff>): boolean {
  const idx = staffList.findIndex(s => s.uuid === uuid);
  if (idx < 0) return false;
  const current = staffList[idx];
  if (!current) return false;
  staffList[idx] = { ...current, ...partial, uuid } as Staff; // uuidは不変
  save();
  return true;
}

/** ステータス更新 */
export function updateStatus(uuid: string, status: StaffStatus): boolean {
  return update(uuid, { status });
}

/** 件数取得 */
export function count(): number {
  return staffList.length;
}

// ============================================================
// 仕訳システム固有
// ============================================================

/** メールアドレスでスタッフ検索（ログイン認証用） */
export function getByEmail(email: string): Staff | undefined {
  return staffList.find(s => s.email.toLowerCase() === email.toLowerCase() && s.status === 'active');
}

/** 有効スタッフのみ取得 */
export function getActiveStaff(): Staff[] {
  return staffList.filter(s => s.status === 'active');
}

/** メールアドレスが登録済みか確認 */
export function isEmailRegistered(email: string): boolean {
  return staffList.some(s => s.email.toLowerCase() === email.toLowerCase() && s.status === 'active');
}

/** ロール別取得 */
export function getByRole(role: StaffRole): Staff[] {
  return staffList.filter(s => s.role === role);
}

// ============================================================
// ヘルパー
// ============================================================

function generateUuid(): string {
  idCounter++;
  return `staff-${String(idCounter).padStart(4, '0')}`;
}

// 起動時に自動読み込み
loadStaff();
