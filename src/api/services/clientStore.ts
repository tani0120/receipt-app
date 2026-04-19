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
// 初期シードデータ（JSONが存在しない場合のみ使用）
// ⚠ staffId値はstaffStore.tsのSEED_DATAのuuidと整合させること
//   staff-0002 = 佐藤 花子, staff-0004 = 田中 次郎
// ============================================================
const SEED_DATA: Client[] = [
  {
    clientId: 'ABC-00001', threeCode: 'ABC', companyName: '株式会社ABC商事', companyNameKana: 'カブシキガイシャエービーシーショウジ',
    type: 'corp', repName: '山田 太郎', repNameKana: 'ヤマダ タロウ',
    phoneNumber: '03-1234-5678', email: 'info@abc-shoij.co.jp', chatRoomUrl: '',
    contact: { type: 'email', value: 'info@abc-shoij.co.jp' },
    fiscalMonth: 3, fiscalDay: '末日', industry: '卸売業・小売業', establishedDate: '20100401', status: 'active',
    accountingSoftware: 'mf', taxFilingType: 'blue', consumptionTaxMode: 'general',
    taxMethod: 'inclusive', calculationMethod: 'accrual', defaultPaymentMethod: 'cash',
    isInvoiceRegistered: true, invoiceRegistrationNumber: 'T1234567890123',
    hasDepartmentManagement: false, hasRentalIncome: false,
    staffId: 'staff-0002', sharedFolderId: '', sharedEmail: 'yamada.taro@gmail.com',
    advisoryFee: 50000, bookkeepingFee: 30000, settlementFee: 200000, taxFilingFee: 100000,
  },
  {
    clientId: 'DEF-00002', threeCode: 'DEF', companyName: '有限会社DEF建設', companyNameKana: 'ユウゲンガイシャディーイーエフケンセツ',
    type: 'corp', repName: '鈴木 一郎', repNameKana: 'スズキ イチロウ',
    phoneNumber: '06-9876-5432', email: 'suzuki@def-kensetsu.co.jp', chatRoomUrl: 'https://www.chatwork.com/#!rid00001',
    contact: { type: 'chatwork', value: 'def-kensetsu' },
    fiscalMonth: 9, fiscalDay: '末日', industry: '建設業', establishedDate: '20050915', status: 'active',
    accountingSoftware: 'yayoi', taxFilingType: 'blue', consumptionTaxMode: 'simplified',
    simplifiedTaxCategory: 3, taxMethod: 'exclusive', calculationMethod: 'accrual', defaultPaymentMethod: 'accounts_payable',
    isInvoiceRegistered: true, invoiceRegistrationNumber: 'T9876543210987',
    hasDepartmentManagement: true, hasRentalIncome: false,
    staffId: 'staff-0004', sharedFolderId: '', sharedEmail: 'suzuki.ichiro@gmail.com',
    advisoryFee: 40000, bookkeepingFee: 20000, settlementFee: 150000, taxFilingFee: 80000,
  },
  {
    clientId: 'GHI-00003', threeCode: 'GHI', companyName: '個人事業 高橋デザイン', companyNameKana: 'コジンジギョウ タカハシデザイン',
    type: 'individual', repName: '高橋 美咲', repNameKana: 'タカハシ ミサキ',
    phoneNumber: '090-1111-2222', email: 'misaki@design.jp', chatRoomUrl: '',
    contact: { type: 'email', value: 'misaki@design.jp' },
    fiscalMonth: 12, fiscalDay: '末日', industry: 'IT・ソフトウェア関連', establishedDate: '20200101', status: 'active',
    accountingSoftware: 'freee', taxFilingType: 'blue', consumptionTaxMode: 'exempt',
    taxMethod: 'inclusive', calculationMethod: 'cash', defaultPaymentMethod: 'owner_loan',
    isInvoiceRegistered: false, invoiceRegistrationNumber: '',
    hasDepartmentManagement: false, hasRentalIncome: true,
    staffId: 'staff-0002', sharedFolderId: '', sharedEmail: '',
    advisoryFee: 20000, bookkeepingFee: 10000, settlementFee: 80000, taxFilingFee: 0,
  },
  {
    clientId: 'JKL-00004', threeCode: 'JKL', companyName: '医療法人社団 健康会', companyNameKana: 'イリョウホウジンシャダン ケンコウカイ',
    type: 'corp', repName: '中村 健太', repNameKana: 'ナカムラ ケンタ',
    phoneNumber: '03-5555-6666', email: '', chatRoomUrl: '',
    contact: { type: 'none', value: '' },
    fiscalMonth: 3, fiscalDay: '末日', industry: '医療・福祉関係業', establishedDate: '19950601', status: 'inactive',
    accountingSoftware: 'tkc', taxFilingType: 'blue', consumptionTaxMode: 'general',
    taxMethod: 'exclusive', calculationMethod: 'accrual', defaultPaymentMethod: 'cash',
    isInvoiceRegistered: true, invoiceRegistrationNumber: 'T5555666677778',
    hasDepartmentManagement: true, hasRentalIncome: false,
    staffId: 'staff-0004', sharedFolderId: '', sharedEmail: '',
    advisoryFee: 80000, bookkeepingFee: 50000, settlementFee: 300000, taxFilingFee: 150000,
  },
  {
    clientId: 'MNO-00005', threeCode: 'MNO', companyName: '株式会社MNOフーズ', companyNameKana: 'カブシキガイシャエムエヌオーフーズ',
    type: 'corp', repName: '小林 洋子', repNameKana: 'コバヤシ ヨウコ',
    phoneNumber: '045-7777-8888', email: 'info@mno-foods.co.jp', chatRoomUrl: '',
    contact: { type: 'email', value: 'info@mno-foods.co.jp' },
    fiscalMonth: 6, fiscalDay: '末日', industry: '飲食業', establishedDate: '20180301', status: 'suspension',
    accountingSoftware: 'mf', taxFilingType: 'blue', consumptionTaxMode: 'general',
    taxMethod: 'inclusive', calculationMethod: 'accrual', defaultPaymentMethod: 'cash',
    isInvoiceRegistered: true, invoiceRegistrationNumber: 'T7777888899990',
    hasDepartmentManagement: false, hasRentalIncome: false,
    staffId: 'staff-0002', sharedFolderId: '', sharedEmail: '',
    advisoryFee: 35000, bookkeepingFee: 25000, settlementFee: 180000, taxFilingFee: 90000,
  },
  {
    clientId: 'ANE-00006', threeCode: 'ANE', companyName: '有限会社ANE工業', companyNameKana: 'ユウゲンガイシャアネコウギョウ',
    type: 'corp', repName: '佐々木 誠', repNameKana: 'ササキ マコト',
    phoneNumber: '048-6666-7777', email: 'sasaki@ane-kogyo.co.jp', chatRoomUrl: '',
    contact: { type: 'email', value: 'sasaki@ane-kogyo.co.jp' },
    fiscalMonth: 9, fiscalDay: '末日', industry: '製造業', establishedDate: '20000301', status: 'active',
    accountingSoftware: 'yayoi', taxFilingType: 'blue', consumptionTaxMode: 'general',
    taxMethod: 'inclusive', calculationMethod: 'accrual', defaultPaymentMethod: 'accounts_payable',
    isInvoiceRegistered: true, invoiceRegistrationNumber: 'T6666777788880',
    hasDepartmentManagement: true, hasRentalIncome: false,
    staffId: null, sharedFolderId: '', sharedEmail: 'sasaki.makoto@gmail.com',
    advisoryFee: 60000, bookkeepingFee: 40000, settlementFee: 250000, taxFilingFee: 120000,
  },
  {
    clientId: 'ORD-00007', threeCode: 'ORD', companyName: 'ORDER壱口店 吉井芳然', companyNameKana: 'オーダーイチグチテン ヨシイヨシノリ',
    type: 'individual', repName: '吉井 芳然', repNameKana: 'ヨシイ ヨシノリ',
    phoneNumber: '090-3333-4444', email: 'yoshii@order.jp', chatRoomUrl: '',
    contact: { type: 'email', value: 'yoshii@order.jp' },
    fiscalMonth: 6, fiscalDay: '末日', industry: '飲食業', establishedDate: '20210801', status: 'active',
    accountingSoftware: 'mf', taxFilingType: 'blue', consumptionTaxMode: 'simplified',
    simplifiedTaxCategory: 4, taxMethod: 'inclusive', calculationMethod: 'cash', defaultPaymentMethod: 'owner_loan',
    isInvoiceRegistered: false, invoiceRegistrationNumber: '',
    hasDepartmentManagement: false, hasRentalIncome: false,
    staffId: null, sharedFolderId: '', sharedEmail: '',
    advisoryFee: 15000, bookkeepingFee: 10000, settlementFee: 60000, taxFilingFee: 0,
  },
  {
    clientId: 'LDI-00008', threeCode: 'LDI', companyName: '株式会社LDIデジタル', companyNameKana: 'カブシキガイシャエルディーアイデジタル',
    type: 'corp', repName: '田村 智子', repNameKana: 'タムラ トモコ',
    phoneNumber: '03-9999-0000', email: 'tamura@ldi-digital.co.jp', chatRoomUrl: '',
    contact: { type: 'email', value: 'tamura@ldi-digital.co.jp' },
    fiscalMonth: 3, fiscalDay: '末日', industry: 'IT・ソフトウェア関連', establishedDate: '20160301', status: 'active',
    accountingSoftware: 'mf', taxFilingType: 'blue', consumptionTaxMode: 'general',
    taxMethod: 'inclusive', calculationMethod: 'accrual', defaultPaymentMethod: 'cash',
    isInvoiceRegistered: true, invoiceRegistrationNumber: 'T9999000011110',
    hasDepartmentManagement: false, hasRentalIncome: false,
    staffId: null, sharedFolderId: '', sharedEmail: 'marke.hughug@gmail.com',
    advisoryFee: 45000, bookkeepingFee: 25000, settlementFee: 180000, taxFilingFee: 90000,
  },
  {
    clientId: 'MHL-00009', threeCode: 'MHL', companyName: '合同会社MHLメディカル', companyNameKana: 'ゴウドウガイシャエムエイチエルメディカル',
    type: 'corp', repName: '橋本 恵子', repNameKana: 'ハシモト ケイコ',
    phoneNumber: '045-1111-2222', email: 'hashimoto@mhl-med.co.jp', chatRoomUrl: '',
    contact: { type: 'email', value: 'hashimoto@mhl-med.co.jp' },
    fiscalMonth: 9, fiscalDay: '末日', industry: '医療・福祉関係業', establishedDate: '20110301', status: 'active',
    accountingSoftware: 'tkc', taxFilingType: 'blue', consumptionTaxMode: 'general',
    taxMethod: 'inclusive', calculationMethod: 'accrual', defaultPaymentMethod: 'cash',
    isInvoiceRegistered: true, invoiceRegistrationNumber: 'T1111222233330',
    hasDepartmentManagement: false, hasRentalIncome: false,
    staffId: null, sharedFolderId: '', sharedEmail: '',
    advisoryFee: 50000, bookkeepingFee: 30000, settlementFee: 200000, taxFilingFee: 100000,
  },
  {
    clientId: 'MUK-00010', threeCode: 'MUK', companyName: '個人事業 MUKU工房', companyNameKana: 'コジンジギョウ ムクコウボウ',
    type: 'individual', repName: '村上 翔太', repNameKana: 'ムラカミ ショウタ',
    phoneNumber: '090-7777-8888', email: 'murakami@muku.jp', chatRoomUrl: '',
    contact: { type: 'email', value: 'murakami@muku.jp' },
    fiscalMonth: 12, fiscalDay: '末日', industry: '製造業', establishedDate: '20230401', status: 'active',
    accountingSoftware: 'freee', taxFilingType: 'blue', consumptionTaxMode: 'exempt',
    taxMethod: 'inclusive', calculationMethod: 'cash', defaultPaymentMethod: 'owner_loan',
    isInvoiceRegistered: false, invoiceRegistrationNumber: '',
    hasDepartmentManagement: false, hasRentalIncome: false,
    staffId: null, sharedFolderId: '', sharedEmail: '',
    advisoryFee: 15000, bookkeepingFee: 8000, settlementFee: 50000, taxFilingFee: 0,
  },
];

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

/** 起動時にJSONから読み込み。なければ初期シード投入 */
export function loadClients(): void {
  try {
    if (existsSync(DATA_FILE)) {
      const raw = readFileSync(DATA_FILE, 'utf-8');
      clients = JSON.parse(raw) as Client[];
      console.log(`[clientStore] ${clients.length}件をJSONから読み込み`);
    } else {
      clients = [...SEED_DATA];
      save();
      console.log(`[clientStore] JSONなし。初期シード${clients.length}件を投入`);
    }
  } catch (err) {
    console.error('[clientStore] JSON読み込みエラー:', err);
    clients = [...SEED_DATA];
    save();
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
  clients[idx] = { ...clients[idx], ...partial, clientId }; // clientIdは不変
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
