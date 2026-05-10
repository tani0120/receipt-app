/**
 * commentStore.ts — コメントJSON永続化ストア
 *
 * 【設計原則】
 * - entityType（client / lead）+ entityId でコメントを一元管理
 * - data/comments.json に永続化（notificationStore.tsと同パターン）
 * - localStorage脱却（DL-042準拠）
 *
 * 【ファイル場所】
 * - data/comments.json
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const DATA_DIR = join(process.cwd(), 'data');
const FILE_PATH = join(DATA_DIR, 'comments.json');

// ============================================================
// 型定義
// ============================================================

/** コメント1件の型 */
export interface Comment {
  /** コメントID（cmt-xxxxxxxx） */
  id: string;
  /** エンティティ種別（client / lead） */
  entityType: 'client' | 'lead';
  /** エンティティID（clientId / leadId） */
  entityId: string;
  /** 投稿者名 */
  author: string;
  /** 本文 */
  body: string;
  /** 日時文字列 */
  date: string;
}

// ============================================================
// 読み書き
// ============================================================

function ensureDir(): void {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
}

/** 全コメントを取得 */
function loadAll(): Comment[] {
  if (!existsSync(FILE_PATH)) return [];
  try {
    return JSON.parse(readFileSync(FILE_PATH, 'utf-8')) as Comment[];
  } catch {
    return [];
  }
}

/** 全件保存（上書き） */
function saveAll(comments: Comment[]): void {
  ensureDir();
  writeFileSync(FILE_PATH, JSON.stringify(comments, null, 2), 'utf-8');
}

// ============================================================
// CRUD
// ============================================================

/** エンティティのコメントを取得（新しい順） */
export function getComments(entityType: string, entityId: string): Comment[] {
  return loadAll().filter(
    c => c.entityType === entityType && c.entityId === entityId,
  );
}

/** コメントを追加（先頭に挿入） */
export function addComment(comment: Comment): Comment {
  const all = loadAll();
  all.unshift(comment);
  saveAll(all);
  return comment;
}

/** コメントを削除 */
export function deleteComment(commentId: string): boolean {
  const all = loadAll();
  const idx = all.findIndex(c => c.id === commentId);
  if (idx === -1) return false;
  all.splice(idx, 1);
  saveAll(all);
  return true;
}

/** エンティティの全コメントを削除 */
export function deleteAllComments(entityType: string, entityId: string): number {
  const all = loadAll();
  const before = all.length;
  const filtered = all.filter(
    c => !(c.entityType === entityType && c.entityId === entityId),
  );
  if (filtered.length < before) {
    saveAll(filtered);
  }
  return before - filtered.length;
}
