/**
 * leadStore.ts — 見込先JSON永続化ストア
 *
 * clientStore.tsと同一構成。Client→Leadに置換。
 * data/leads.json に永続化。
 *
 * 準拠: DL-042
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import crypto from 'crypto';
import type { Lead, LeadStatus } from '../../repositories/types';

const DATA_DIR = join(process.cwd(), 'data');
const DATA_FILE = join(DATA_DIR, 'leads.json');

let leads: Lead[] = [];

function save(): void {
  try {
    if (!existsSync(DATA_DIR)) {
      mkdirSync(DATA_DIR, { recursive: true });
    }
    writeFileSync(DATA_FILE, JSON.stringify(leads, null, 2), 'utf-8');
  } catch (err) {
    console.error('[leadStore] JSON書き出しエラー:', err);
  }
}

/** 起動時にJSONから読み込み */
export function loadLeads(): void {
  try {
    if (existsSync(DATA_FILE)) {
      const raw = readFileSync(DATA_FILE, 'utf-8');
      leads = JSON.parse(raw) as Lead[];
      console.log(`[leadStore] ${leads.length}件をJSONから読み込み`);
    } else {
      leads = [];
      save();
      console.log('[leadStore] JSONなし。空配列で初期化');
    }
  } catch (err) {
    console.error('[leadStore] JSON読み込みエラー:', err);
    leads = [];
  }
}

/** 全件取得 */
export function getAll(): Lead[] {
  return [...leads];
}

/** leadIdで1件取得 */
export function getById(leadId: string): Lead | undefined {
  return leads.find(l => l.leadId === leadId);
}

/** 1件追加 */
export function create(lead: Lead): Lead {
  leads.push(lead);
  save();
  console.log(`[leadStore] 追加: ${lead.companyName} (${lead.leadId})`);
  return lead;
}

/** 部分更新 */
export function updateLead(leadId: string, partial: Partial<Lead>): boolean {
  const idx = leads.findIndex(l => l.leadId === leadId);
  if (idx < 0) return false;
  leads[idx] = { ...leads[idx], ...partial, leadId } as Lead;
  save();
  return true;
}

/** ステータス更新 */
export function updateStatus(leadId: string, status: LeadStatus): boolean {
  return updateLead(leadId, { status });
}

/** 件数取得 */
export function count(): number {
  return leads.length;
}

/** 担当者別取得 */
export function getByStaffId(staffId: string): Lead[] {
  return leads.filter(l => l.staffId === staffId);
}

/** 有効見込先のみ取得 */
export function getActiveLeads(): Lead[] {
  return leads.filter(l => l.status === 'active');
}

/** ステータス別取得 */
export function getByStatus(status: LeadStatus): Lead[] {
  return leads.filter(l => l.status === status);
}

/** 担当者変更 */
export function updateStaffAssignment(leadId: string, staffId: string | null): boolean {
  return updateLead(leadId, { staffId });
}

/** Drive共有フォルダ設定 */
export function updateSharedFolderId(leadId: string, folderId: string): boolean {
  return updateLead(leadId, { sharedFolderId: folderId });
}

/** メール設定 */
export function updateSharedEmail(leadId: string, email: string): boolean {
  return updateLead(leadId, { sharedEmail: email });
}

/**
 * ランダムなleadIdを生成する。
 * 形式: l_{8文字ランダム}（例: l_7kXp2mN9）
 * 3コードに依存しない。Supabase移行後は gen_random_uuid() に差し替え。
 */
export function generateLeadId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = crypto.randomBytes(8);
  let id = 'l_';
  for (let i = 0; i < 8; i++) {
    id += chars[bytes[i]! % chars.length];
  }
  return id;
}

// 起動時に自動読み込み
loadLeads();
