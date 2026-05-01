/**
 * supportingSearchService.ts — 根拠資料メタデータ保存・検索サービス
 *
 * 責務:
 *   - 確定送信時にsupportingドキュメントのメタデータをJSONファイルに保存
 *   - 自由キーワードで根拠資料を検索（ファイル名、日付、金額、取引先名、摘要を横断検索）
 *
 * 保存先: data/supporting_meta_{clientId}.json
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const DATA_DIR = join(process.cwd(), 'data');

/** 根拠資料メタデータ（検索用） */
export interface SupportingMeta {
  /** ドキュメントID（一意） */
  id: string;
  /** 顧問先ID */
  clientId: string;
  /** ファイル名 */
  fileName: string;
  /** プレビューURL（画像表示用） */
  previewUrl: string;
  /** 日付（AI抽出値。検索用） */
  date: string | null;
  /** 金額（AI抽出値。検索用） */
  amount: number | null;
  /** 取引先名（AI抽出値。検索用） */
  vendor: string | null;
  /** 摘要・説明（AI抽出値。検索用） */
  description: string | null;
  /** 証票種類（AI抽出値。検索用） */
  sourceType: string | null;
  /** 検索用テキスト（全フィールド連結。小文字化済み） */
  searchText: string;
  /** 保存日時（ISO） */
  savedAt: string;
}

function getFilePath(clientId: string): string {
  return join(DATA_DIR, `supporting_meta_${clientId}.json`);
}

function readMeta(clientId: string): SupportingMeta[] {
  const path = getFilePath(clientId);
  if (!existsSync(path)) return [];
  try {
    return JSON.parse(readFileSync(path, 'utf-8')) as SupportingMeta[];
  } catch {
    return [];
  }
}

function writeMeta(clientId: string, data: SupportingMeta[]): void {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
  writeFileSync(getFilePath(clientId), JSON.stringify(data, null, 2), 'utf-8');
}

/**
 * 根拠資料メタデータを一括保存（確定送信時に呼び出し）
 * 既存IDは上書き（冪等性確保）
 */
export function saveSupportingMeta(clientId: string, items: Omit<SupportingMeta, 'searchText' | 'savedAt'>[]): number {
  const existing = readMeta(clientId);
  const now = new Date().toISOString();
  let addedCount = 0;

  for (const item of items) {
    // 検索用テキスト生成（全フィールドを連結して小文字化）
    const searchText = [
      item.fileName,
      item.date,
      item.amount != null ? String(item.amount) : '',
      item.vendor,
      item.description,
      item.sourceType,
    ].filter(Boolean).join(' ').toLowerCase();

    const meta: SupportingMeta = {
      ...item,
      searchText,
      savedAt: now,
    };

    // 既存IDは上書き
    const idx = existing.findIndex(e => e.id === item.id);
    if (idx >= 0) {
      existing[idx] = meta;
    } else {
      existing.push(meta);
      addedCount++;
    }
  }

  writeMeta(clientId, existing);
  console.log(`[supportingSearchService] ${clientId}: ${addedCount}件の根拠資料メタデータを保存（合計${existing.length}件）`);
  return addedCount;
}

/**
 * 自由キーワードで根拠資料を検索
 * スペース区切りで AND 検索。全フィールドを横断的に検索。
 */
export function searchSupporting(clientId: string, query: string): SupportingMeta[] {
  if (!query || !query.trim()) {
    // クエリなし → 全件返す（最新順、最大50件）
    return readMeta(clientId)
      .sort((a, b) => b.savedAt.localeCompare(a.savedAt))
      .slice(0, 50);
  }

  const keywords = query.toLowerCase().split(/\s+/).filter(Boolean);
  const all = readMeta(clientId);

  return all
    .filter(m => keywords.every(kw => m.searchText.includes(kw)))
    .sort((a, b) => b.savedAt.localeCompare(a.savedAt))
    .slice(0, 50);
}

/**
 * 根拠資料メタデータの件数取得（バッジ表示用）
 */
export function getSupportingMetaCount(clientId: string): number {
  return readMeta(clientId).length;
}
