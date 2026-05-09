/**
 * フィールドレイアウト保存/取得API
 * 管理者が設定したフィールド順序・横幅を全ユーザーに共通適用
 */
import { Hono } from 'hono';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const fieldLayoutRoutes = new Hono();

const DATA_DIR = path.resolve(process.cwd(), 'data', 'field-layouts');

/** データファイルパス */
const getFilePath = (pageId: string) => {
  // pageIdのバリデーション（英数字とハイフンのみ）
  if (!/^[a-zA-Z0-9-]+$/.test(pageId)) {
    throw new Error('不正なページID');
  }
  return path.join(DATA_DIR, `${pageId}.json`);
};

/** レイアウト取得 */
fieldLayoutRoutes.get('/:pageId', async (c) => {
  const pageId = c.req.param('pageId');
  try {
    const filePath = getFilePath(pageId);
    if (!existsSync(filePath)) {
      return c.json({ message: '保存済みレイアウトなし' }, 404);
    }
    const data = await readFile(filePath, 'utf-8');
    return c.json(JSON.parse(data));
  } catch {
    return c.json({ error: 'レイアウト取得失敗' }, 500);
  }
});

/** レイアウト保存（管理者のみ） */
fieldLayoutRoutes.put('/:pageId', async (c) => {
  const pageId = c.req.param('pageId');
  try {
    const body = await c.req.json();

    // ディレクトリ作成
    if (!existsSync(DATA_DIR)) {
      await mkdir(DATA_DIR, { recursive: true });
    }

    const filePath = getFilePath(pageId);
    await writeFile(filePath, JSON.stringify(body, null, 2), 'utf-8');

    return c.json({ success: true });
  } catch {
    return c.json({ error: 'レイアウト保存失敗' }, 500);
  }
});

/** レイアウト削除（デフォルトにリセット） */
fieldLayoutRoutes.delete('/:pageId', async (c) => {
  const pageId = c.req.param('pageId');
  try {
    const filePath = getFilePath(pageId);
    if (existsSync(filePath)) {
      const { unlink } = await import('node:fs/promises');
      await unlink(filePath);
    }
    return c.json({ success: true });
  } catch {
    return c.json({ error: 'レイアウト削除失敗' }, 500);
  }
});

export default fieldLayoutRoutes;
