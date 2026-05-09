/**
 * AIプロンプト管理APIルート（Hono）
 *
 * プロンプト文をJSON永続化し、GET/PUTで管理可能にする。
 * Supabase移行時: ai_prompts テーブルに差し替え
 *
 * エンドポイント:
 *   GET  /api/ai-prompts          — 全プロンプト一覧
 *   GET  /api/ai-prompts/:promptId — 単体取得
 *   PUT  /api/ai-prompts/:promptId — 更新（管理者）
 */
import { Hono } from 'hono';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import {
  OCR_SIMPLE_PROMPT,
  OCR_DETAILED_PROMPT,
  OCR_VERTEX_PROMPT,
  SYSTEM_INSTRUCTION,
} from '../../constants/aiPrompts';
import { UI_MSG } from '../../constants/uiMessages';

const app = new Hono();

const DATA_DIR = path.resolve(process.cwd(), 'data', 'ai-prompts');
const PROMPTS_FILE = path.join(DATA_DIR, 'prompts.json');

/** プロンプトID → デフォルト値のマッピング */
const DEFAULT_PROMPTS: Record<string, { label: string; content: string }> = {
  'ocr-simple': {
    label: UI_MSG.プロンプトラベル_簡易OCR,
    content: OCR_SIMPLE_PROMPT,
  },
  'ocr-detailed': {
    label: UI_MSG.プロンプトラベル_詳細OCR,
    content: OCR_DETAILED_PROMPT,
  },
  'ocr-vertex': {
    label: UI_MSG.プロンプトラベル_VertexOCR,
    content: OCR_VERTEX_PROMPT,
  },
  'system-instruction': {
    label: UI_MSG.プロンプトラベル_SystemInstruction,
    content: SYSTEM_INSTRUCTION,
  },
};

/** 永続化ファイルからプロンプトを読み取り（なければデフォルト返却） */
async function loadPrompts(): Promise<Record<string, { label: string; content: string }>> {
  if (!existsSync(PROMPTS_FILE)) {
    return { ...DEFAULT_PROMPTS };
  }
  try {
    const raw = await readFile(PROMPTS_FILE, 'utf-8');
    const saved = JSON.parse(raw) as Record<string, { label: string; content: string }>;
    // デフォルトとマージ（新規追加されたプロンプトも含める）
    return { ...DEFAULT_PROMPTS, ...saved };
  } catch {
    return { ...DEFAULT_PROMPTS };
  }
}

/** 永続化ファイルに書き込み */
async function savePrompts(data: Record<string, { label: string; content: string }>): Promise<void> {
  if (!existsSync(DATA_DIR)) {
    await mkdir(DATA_DIR, { recursive: true });
  }
  await writeFile(PROMPTS_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// ── GET /api/ai-prompts — 全プロンプト一覧 ──
app.get('/', async (c) => {
  try {
    const prompts = await loadPrompts();
    const list = Object.entries(prompts).map(([id, { label, content }]) => ({
      promptId: id,
      label,
      contentLength: content.length,
      // 一覧ではcontent全文は返さない（重い）
    }));
    return c.json({ prompts: list });
  } catch {
    return c.json({ error: UI_MSG.APIエラー_プロンプト一覧取得失敗 }, 500);
  }
});

// ── GET /api/ai-prompts/:promptId — 単体取得 ──
app.get('/:promptId', async (c) => {
  const promptId = c.req.param('promptId');
  try {
    const prompts = await loadPrompts();
    const prompt = prompts[promptId];
    if (!prompt) {
      return c.json({ error: `プロンプト「${promptId}」${UI_MSG.APIエラー_プロンプト未検出}` }, 404);
    }
    return c.json({ promptId, ...prompt });
  } catch {
    return c.json({ error: UI_MSG.APIエラー_プロンプト取得失敗 }, 500);
  }
});

// ── PUT /api/ai-prompts/:promptId — 更新 ──
app.put('/:promptId', async (c) => {
  const promptId = c.req.param('promptId');
  try {
    const body = await c.req.json<{ content?: string; label?: string }>();
    if (!body.content && !body.label) {
      return c.json({ error: UI_MSG.APIエラー_プロンプト更新必須 }, 400);
    }

    const prompts = await loadPrompts();
    const existing = prompts[promptId] ?? DEFAULT_PROMPTS[promptId];
    if (!existing) {
      return c.json({ error: `プロンプト「${promptId}」${UI_MSG.APIエラー_プロンプト未検出}` }, 404);
    }

    prompts[promptId] = {
      label: body.label ?? existing.label,
      content: body.content ?? existing.content,
    };

    await savePrompts(prompts);
    return c.json({ success: true, promptId });
  } catch {
    return c.json({ error: UI_MSG.APIエラー_プロンプト更新失敗 }, 500);
  }
});

export default app;

// ── OCRサービスから呼ぶ：プロンプト取得関数 ──

/**
 * 指定IDのプロンプト本文を取得（永続化ファイル優先、フォールバック: 定数）
 *
 * OCRサービスはこの関数を使ってプロンプトを取得する。
 * デプロイなしでプロンプト変更が可能。
 */
export async function getPromptContent(promptId: string): Promise<string> {
  const prompts = await loadPrompts();
  return prompts[promptId]?.content ?? DEFAULT_PROMPTS[promptId]?.content ?? '';
}
