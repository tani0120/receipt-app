/**
 * 一覧ビュー管理API
 * 管理者が設定したビュー定義（表示列・フィルタ・ソート）を全ユーザーに共通適用
 * kintone風の一覧管理機能用
 */
import { Hono } from 'hono';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const listViewRoutes = new Hono();

const DATA_DIR = path.resolve(process.cwd(), 'data', 'list-views');

/** データファイルパス（entityType = 'client' | 'lead'） */
const getFilePath = (entityType: string) => {
  // entityTypeのバリデーション（英数字とハイフンのみ）
  if (!/^[a-zA-Z0-9-]+$/.test(entityType)) {
    throw new Error('不正なエンティティタイプ');
  }
  return path.join(DATA_DIR, `${entityType}.json`);
};

/** ビュー一覧取得 */
listViewRoutes.get('/:entityType', async (c) => {
  const entityType = c.req.param('entityType');
  try {
    const filePath = getFilePath(entityType);
    if (!existsSync(filePath)) {
      // 未設定の場合は空配列を返す（「（すべて）」はフロント側で自動追加）
      return c.json({ views: [] });
    }
    const data = await readFile(filePath, 'utf-8');
    return c.json(JSON.parse(data));
  } catch {
    return c.json({ error: 'ビュー一覧取得失敗' }, 500);
  }
});

/** ビュー一覧保存（全件上書き） */
listViewRoutes.put('/:entityType', async (c) => {
  const entityType = c.req.param('entityType');
  try {
    const body = await c.req.json();

    // ディレクトリ作成
    if (!existsSync(DATA_DIR)) {
      await mkdir(DATA_DIR, { recursive: true });
    }

    const filePath = getFilePath(entityType);
    await writeFile(filePath, JSON.stringify(body, null, 2), 'utf-8');

    return c.json({ success: true });
  } catch {
    return c.json({ error: 'ビュー一覧保存失敗' }, 500);
  }
});

export default listViewRoutes;
