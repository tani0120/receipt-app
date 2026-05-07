/**
 * guestUserStore.ts — ゲストユーザーJSON永続化ストア
 *
 * 【設計原則】
 * - サーバー側のインメモリ + JSONファイル永続化
 * - 起動時にJSONから読み込み、更新時にJSONに書き出し
 * - Supabase移行時にSupabase Auth（signUp/signInWithPassword）に差し替え
 * - 型はrepositories/types.tsから一元参照が理想だが、
 *   ゲストユーザー型はSupabase Auth移行で消えるため、ここにローカル定義
 *
 * 【ファイル場所】
 * - data/guest_users.json（.gitignoreに追加済み）
 *
 * 【用途】
 * - 顧問先担当者のメール+パスワード認証（パソコンのみフロー）
 * - ログイン/新規登録（MockPortalLoginPage.vue から呼び出し）
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { createHash, randomBytes } from 'crypto';

const DATA_DIR = join(process.cwd(), 'data');
const DATA_FILE = join(DATA_DIR, 'guest_users.json');

/** ゲストユーザー（モック認証用。Supabase移行時にAuth.usersテーブルに差し替え） */
export interface GuestUser {
  /** UUID */
  id: string
  /** 表示名（例: 田中太郎） */
  displayName: string
  /** メールアドレス（ログインID） */
  email: string
  /** パスワードハッシュ（SHA-256。本番ではbcrypt/argon2に置き換え） */
  passwordHash: string
  /** 紐付き顧問先ID */
  clientId: string
  /** 作成日時（ISO 8601） */
  createdAt: string
}

// インメモリストア
let users: GuestUser[] = [];

/** SHA-256ハッシュ生成（モック用簡易実装。本番ではbcrypt推奨） */
function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

/** g_XXXXXXXX形式のゲストユーザーIDを生成 */
function generateId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = randomBytes(8);
  let id = 'g_';
  for (let i = 0; i < 8; i++) {
    id += chars[bytes[i]! % chars.length];
  }
  return id;
}

/**
 * 起動時にJSONから読み込み
 */
export function loadGuestUsers(): void {
  try {
    if (existsSync(DATA_FILE)) {
      const raw = readFileSync(DATA_FILE, 'utf-8');
      users = JSON.parse(raw) as GuestUser[];
      console.log(`[guestUserStore] ${users.length}件をJSONから読み込み`);
    } else {
      users = [];
      console.log('[guestUserStore] JSONファイルなし。空で起動');
    }
  } catch (err) {
    console.error('[guestUserStore] JSON読み込みエラー:', err);
    users = [];
  }
}

/**
 * JSONに書き出し
 */
function save(): void {
  try {
    if (!existsSync(DATA_DIR)) {
      mkdirSync(DATA_DIR, { recursive: true });
    }
    writeFileSync(DATA_FILE, JSON.stringify(users, null, 2), 'utf-8');
  } catch (err) {
    console.error('[guestUserStore] JSON書き出しエラー:', err);
  }
}

/**
 * 新規登録
 * @returns 成功時: ユーザー情報（パスワードハッシュ除外）。失敗時: null + エラーメッセージ
 */
export function register(
  email: string,
  password: string,
  displayName: string,
  clientId: string,
): { user: Omit<GuestUser, 'passwordHash'> } | { error: string } {
  // メール重複チェック
  const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return { error: 'このメールアドレスは既に登録されています' };
  }

  // パスワードバリデーション
  if (password.length < 8) {
    return { error: 'パスワードは8文字以上で設定してください' };
  }

  const user: GuestUser = {
    id: generateId(),
    displayName,
    email: email.toLowerCase(),
    passwordHash: hashPassword(password),
    clientId,
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  save();
  console.log(`[guestUserStore] 新規登録: ${email} (clientId=${clientId})`);

  const { passwordHash: _, ...safeUser } = user;
  return { user: safeUser };
}

/**
 * ログイン
 * @returns 成功時: ユーザー情報。失敗時: null + エラーメッセージ
 */
export function login(
  email: string,
  password: string,
): { user: Omit<GuestUser, 'passwordHash'> } | { error: string } {
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    return { error: 'メールアドレスまたはパスワードが正しくありません' };
  }

  if (user.passwordHash !== hashPassword(password)) {
    return { error: 'メールアドレスまたはパスワードが正しくありません' };
  }

  console.log(`[guestUserStore] ログイン成功: ${email} (clientId=${user.clientId})`);
  const { passwordHash: _, ...safeUser } = user;
  return { user: safeUser };
}

/**
 * メールアドレスでユーザー検索（内部用）
 */
export function findByEmail(email: string): GuestUser | undefined {
  return users.find(u => u.email.toLowerCase() === email.toLowerCase());
}

// 起動時に自動読み込み
loadGuestUsers();
