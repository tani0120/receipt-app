/**
 * Phase 5 繝・せ繝医ヵ繧｣繧ｯ繧ｹ繝√Ε・・0莉ｶ + 隍・粋莉戊ｨｳ5莉ｶ = 35莉ｶ縲ゆｻｶ謨ｰ縺ｯ莉雁ｾ悟｢玲ｸ帙☆繧具ｼ・ *
 * 逶ｮ逧・ UI繝｢繝・け讀懆ｨｼ縲√ヵ繝ｭ繝ｳ繝医お繝ｳ繝牙ｮ溯｣・�√ヰ繝・け繧ｨ繝ｳ繝牙ｮ溯｣・〒菴ｿ逕ｨ
 * 蜿ら・: phase5_level3_test_fixture_30cases_260214.md.resolved
 * 譖ｴ譁ｰ: 2026-02-15 - status蛟､繧弾xported縺ｮ縺ｿ縺ｫ螟画峩縲∬ｦ∝ｯｾ蠢懊Λ繝吶Ν霑ｽ蜉�
 */

import type { JournalPhase5Mock } from '../types/journal_phase5_mock.type';
import { createEmptyStaffNotes } from '../types/staff_notes';

export const mockJournalsPhase5: JournalPhase5Mock[] = [
  // ============================================================
  // 陦・-10: 繧ｰ繝ｪ繝ｼ繝ｳ・域ｭ｣蟶ｸ縲√ヰ繝ｪ繧ｨ繝ｼ繧ｷ繝ｧ繝ｳ雎雁ｯ鯉ｼ・  // ============================================================

  // 陦・: 莠､騾夊ｲｻ・医ち繧ｯ繧ｷ繝ｼ・峨�√Ν繝ｼ繝ｫ驕ｩ逕ｨ貂医∩縲・←譬ｼ隲区ｱよ嶌
  {
    id: 'jrn-00000001',
    display_order: 1,
    voucher_date: '2024-07-29', date_on_document: true,
    voucher_type: null, description: '逾樊虻逶ｸ莠偵ち繧ｯ繧ｷ繝ｼ',
    document_id: 'receipt-001',
    line_id: null,
    status: 'exported',  // 蜃ｺ蜉帶ｸ医∩
    is_read: true,
    deleted_at: null,
    labels: ['TRANSPORT', 'RULE_APPLIED', 'INVOICE_QUALIFIED'],
    debit_entries: [
      { account: '譌・ｲｻ莠､騾夊ｲｻ', account_on_document: true, sub_account: null, amount: 800, amount_on_document: true, tax_category_id: '隱ｲ遞惹ｻ募・ 10%' }
    ],
    credit_entries: [
      { account: '迴ｾ驥・, account_on_document: true, sub_account: null, amount: 800, amount_on_document: true, tax_category_id: '蟇ｾ雎｡螟・ }
    ],
    rule_id: 'r001',
    rule_confidence: 0.95,
    invoice_status: 'qualified',
    invoice_number: 'T1234567890123',
    memo: null,
    memo_author: null,
    memo_target: null,
    memo_created_at: null,
    staff_notes: null,
    staff_notes_author: null,
    is_credit_card_payment: false
  },

  // 陦・: 繝ｬ繧ｷ繝ｼ繝医�√Ν繝ｼ繝ｫ驕ｩ逕ｨ蜿ｯ閭ｽ縲∽ｸ埼←譬ｼ隲区ｱよ嶌
  {
    id: 'jrn-00000002',
    display_order: 2,
    voucher_date: '2025-01-20', date_on_document: true,
    voucher_type: null, description: 'VIVACE BEAUTY繧ｯ繝ｪ繝九ャ繧ｯ',
    document_id: 'receipt-001',
    line_id: null,
    status: 'exported',  // 蜃ｺ蜉帶ｸ医∩
    is_read: false,  // 譛ｪ隱ｭ・磯ｻ・牡閭梧勹・・    deleted_at: null,
    labels: ['RECEIPT', 'RULE_AVAILABLE', 'INVOICE_NOT_QUALIFIED', 'NEED_DOCUMENT'],  // 譖ｸ鬘槭′荳崎ｶｳ
    debit_entries: [
      { account: '繝｡繝ｳ繝・リ繝ｳ繧ｹ雋ｻ', account_on_document: true, sub_account: null, amount: 11000, amount_on_document: true, tax_category_id: '隱ｲ遞惹ｻ募・ 10%' }
    ],
    credit_entries: [
      { account: '迴ｾ驥・, account_on_document: true, sub_account: null, amount: 11000, amount_on_document: true, tax_category_id: '蟇ｾ雎｡螟・ }
    ],
    rule_id: null,
    rule_confidence: null,
    invoice_status: 'not_qualified',
    invoice_number: null,
    memo: null,
    memo_author: null,
    memo_target: null,
    memo_created_at: null,
    staff_notes: {
      ...createEmptyStaffNotes(),
      NEED_DOCUMENT: { enabled: true, text: '隲区ｱよ嶌縺ｮ蜴滓悽繧偵♀騾√ｊ縺上□縺輔＞', chatworkUrl: 'https://www.chatwork.com/#!rid00001' }
    },
    staff_notes_author: '螻ｱ逕ｰ螟ｪ驛・,
    is_credit_card_payment: false
  },

  // 陦・: 繝ｬ繧ｷ繝ｼ繝医�√Ν繝ｼ繝ｫ驕ｩ逕ｨ貂医∩縲・←譬ｼ隲区ｱよ嶌
  {
    id: 'jrn-00000003',
    display_order: 3,
    voucher_date: '2025-01-21', date_on_document: true,
    voucher_type: null, description: '繧ｳ繝斐・逕ｨ邏・,
    document_id: 'receipt-001',
    line_id: null,
    status: 'exported',  // 蜃ｺ蜉帶ｸ医∩
    is_read: false,  // 譛ｪ隱ｭ・磯ｻ・牡閭梧勹・・    deleted_at: null,
    labels: ['RECEIPT', 'INVOICE_QUALIFIED', 'NEED_INFO'],  // 諠・�ｱ縺御ｸ崎ｶｳ・域立NEED_CONFIRM・・    debit_entries: [
      { account: '豸郁�怜刀雋ｻ', account_on_document: true, sub_account: null, amount: 2500, amount_on_document: true, tax_category_id: '隱ｲ遞惹ｻ募・ 10%' }
    ],
    credit_entries: [
      { account: '迴ｾ驥・, account_on_document: true, sub_account: null, amount: 2500, amount_on_document: true, tax_category_id: '蟇ｾ雎｡螟・ }
    ],
    rule_id: null,
    rule_confidence: null,
    invoice_status: 'qualified',
    invoice_number: 'T9876543210987',
    memo: null,
    memo_author: null,
    memo_target: null,
    memo_created_at: null,
    staff_notes: {
      ...createEmptyStaffNotes(),
      NEED_INFO: { enabled: true, text: '縺薙・莉戊ｨｳ縺ｮ蜀・ｮｹ縺ｧ蜷医▲縺ｦ縺・∪縺吶°・・, chatworkUrl: '' }
    },
    staff_notes_author: '菴占陸闃ｱ蟄・,
    is_credit_card_payment: false
  },

  // 陦・: 譁・袷蜈ｷ繧ｻ繝・ヨ縲√Ν繝ｼ繝ｫ驕ｩ逕ｨ貂医∩縲・←譬ｼ隲区ｱよ嶌
  {
    id: 'jrn-00000004',
    display_order: 4,
    voucher_date: '2025-01-22', date_on_document: true,
    voucher_type: null, description: '譁・袷蜈ｷ繧ｻ繝・ヨ',
    document_id: 'receipt-001',
    line_id: null,
    status: 'exported',  // 蜃ｺ蜉帶ｸ医∩
    is_read: true,
    deleted_at: null,
    labels: ['CREDIT_CARD', 'INVOICE_QUALIFIED'],
    debit_entries: [
      { account: '豸郁�怜刀雋ｻ', account_on_document: true, sub_account: null, amount: 3200, amount_on_document: true, tax_category_id: '隱ｲ遞惹ｻ募・ 10%' }
    ],
    credit_entries: [
      { account: '譛ｪ謇暮≡', account_on_document: true, sub_account: null, amount: 3200, amount_on_document: true, tax_category_id: '蟇ｾ雎｡螟・ }
    ],
    rule_id: null,
    rule_confidence: null,
    invoice_status: 'qualified',
    invoice_number: 'T1111111111111',
    memo: null,
    memo_author: null,
    memo_target: null,
    memo_created_at: null,
    staff_notes: null,
    staff_notes_author: null,
    is_credit_card_payment: true
  },

  // 陦・: 繧ｿ繧ｯ繧ｷ繝ｼ莉｣・井ｸ埼←譬ｼ驕矩�・ｼ峨�√Ν繝ｼ繝ｫ驕ｩ逕ｨ貂医∩縲・←譬ｼ隲区ｱよ嶌
  {
    id: 'jrn-00000005',
    display_order: 5,
    voucher_date: '2025-01-23', date_on_document: true,
    voucher_type: null, description: '繧ｿ繧ｯ繧ｷ繝ｼ莉｣・井ｸ埼←譬ｼ驕矩�・ｼ・,
    document_id: 'receipt-001',
    line_id: null,
    status: 'exported',  // 蜃ｺ蜉帶ｸ医∩
    is_read: true,
    deleted_at: null,
    labels: ['BANK_STATEMENT', 'RULE_APPLIED', 'INVOICE_QUALIFIED', 'NEED_CONSULT'],  // 遉ｾ蜀・嶌隲・☆繧・    debit_entries: [
      { account: '譌・ｲｻ莠､騾夊ｲｻ', account_on_document: true, sub_account: null, amount: 650, amount_on_document: true, tax_category_id: '隱ｲ遞惹ｻ募・ 10%' }
    ],
    credit_entries: [
      { account: '譎ｮ騾夐�宣≡', account_on_document: true, sub_account: '荳芽廠UFJ', amount: 650, amount_on_document: true, tax_category_id: '蟇ｾ雎｡螟・ }
    ],
    rule_id: 'r003',
    rule_confidence: 0.88,
    invoice_status: 'qualified',
    invoice_number: 'T2222222222222',
    memo: null,
    memo_author: null,
    memo_target: null,
    memo_created_at: null,
    staff_notes: {
      ...createEmptyStaffNotes(),
      NEED_CONSULT: { enabled: true, text: '遞主漁蜃ｦ逅・・蛻､譁ｭ縺ｫ霑ｷ縺・′縺ゅｊ縺ｾ縺・, chatworkUrl: 'https://www.chatwork.com/#!rid00005' }
    },
    staff_notes_author: '驤ｴ譛ｨ荳�驛・,
    is_credit_card_payment: false
  },

  // 陦・: 繧ｿ繧ｯ繧ｷ繝ｼ莉｣縲√Ν繝ｼ繝ｫ驕ｩ逕ｨ貂医∩縲・←譬ｼ隲区ｱよ嶌
  {
    id: 'jrn-00000006',
    display_order: 6,
    voucher_date: '2025-01-24', date_on_document: true,
    voucher_type: null, description: '繧ｿ繧ｯ繧ｷ繝ｼ莉｣',
    document_id: 'receipt-001',
    line_id: null,
    status: 'exported',  // 蜃ｺ蜉帶ｸ医∩
    is_read: true,
    deleted_at: null,
    labels: ['TRANSPORT', 'RULE_APPLIED', 'INVOICE_QUALIFIED'],
    debit_entries: [
      { account: '譌・ｲｻ莠､騾夊ｲｻ', account_on_document: true, sub_account: null, amount: 1500, amount_on_document: true, tax_category_id: '隱ｲ遞惹ｻ募・ 10%' }
    ],
    credit_entries: [
      { account: '迴ｾ驥・, account_on_document: true, sub_account: null, amount: 1500, amount_on_document: true, tax_category_id: '蟇ｾ雎｡螟・ }
    ],
    rule_id: 'r004',
    rule_confidence: 0.92,
    invoice_status: 'qualified',
    invoice_number: 'T3333333333333',
    memo: null,
    memo_author: null,
    memo_target: null,
    memo_created_at: null,
    staff_notes: null,
    staff_notes_author: null,
    is_credit_card_payment: false
  },

  // 陦・: 髮ｻ豌嶺ｻ｣・磯未隘ｿ髮ｻ蜉幢ｼ峨�√Ν繝ｼ繝ｫ驕ｩ逕ｨ貂医∩縲・←譬ｼ隲区ｱよ嶌Note: 驕ｩ譬ｼ隲区ｱよ嶌縺檎匱陦後＆繧後◆縺溘ａ縲・←譬ｼ隲区ｱよ嶌
  {
    id: 'jrn-00000007',
    display_order: 7,
    voucher_date: '2025-01-25', date_on_document: true,
    voucher_type: null, description: '髮ｻ豌嶺ｻ｣ 髢｢隘ｿ髮ｻ蜉・,
    document_id: 'receipt-001',
    line_id: null,
    status: 'exported',  // 蜃ｺ蜉帶ｸ医∩
    is_read: true,
    deleted_at: null,
    labels: ['INVOICE', 'RULE_APPLIED', 'INVOICE_QUALIFIED'],
    debit_entries: [
      { account: '豌ｴ驕灘・辭ｱ雋ｻ', account_on_document: true, sub_account: '髮ｻ豌嶺ｻ｣', amount: 12000, amount_on_document: true, tax_category_id: '隱ｲ遞惹ｻ募・ 10%' }
    ],
    credit_entries: [
      { account: '譎ｮ騾夐�宣≡', account_on_document: true, sub_account: '荳芽廠UFJ', amount: 12000, amount_on_document: true, tax_category_id: '蟇ｾ雎｡螟・ }
    ],
    rule_id: 'r005',
    rule_confidence: 0.97,
    invoice_status: 'qualified',
    invoice_number: 'T4444444444444',
    memo: null,
    memo_author: null,
    memo_target: null,
    memo_created_at: null,
    staff_notes: null,
    staff_notes_author: null,
    is_credit_card_payment: true
  },

  // 陦・: 繧ｹ繧ｿ繝ｼ繝舌ャ繧ｯ繧ｹ縲√Ν繝ｼ繝ｫ驕ｩ逕ｨ貂医∩縲・←譬ｼ隲区ｱよ嶌
  {
    id: 'jrn-00000008',
    display_order: 8,
    voucher_date: '2025-01-26', date_on_document: true,
    voucher_type: null, description: '繧ｹ繧ｿ繝ｼ繝舌ャ繧ｯ繧ｹ',
    document_id: 'receipt-001',
    line_id: null,
    status: 'exported',  // 蜃ｺ蜉帶ｸ医∩
    is_read: true,
    deleted_at: null,
    labels: ['RECEIPT', 'INVOICE_QUALIFIED'],
    debit_entries: [
      { account: '莨夊ｭｰ雋ｻ', account_on_document: true, sub_account: null, amount: 1200, amount_on_document: true, tax_category_id: '隱ｲ遞惹ｻ募・ 10%' }
    ],
    credit_entries: [
      { account: '迴ｾ驥・, account_on_document: true, sub_account: null, amount: 1200, amount_on_document: true, tax_category_id: '蟇ｾ雎｡螟・ }
    ],
    rule_id: null,
    rule_confidence: null,
    invoice_status: 'qualified',
    invoice_number: 'T5555555555555',
    memo: null,
    memo_author: null,
    memo_target: null,
    memo_created_at: null,
    is_credit_card_payment: false
  },

  // 陦・: 讌ｭ蜍吝ｧ碑ｨ玲侭縲√Ν繝ｼ繝ｫ驕ｩ逕ｨ貂医∩縲・←譬ｼ隲区ｱよ嶌
  {
    id: 'jrn-00000009',
    display_order: 9,
    voucher_date: '2025-01-27', date_on_document: true,
    voucher_type: null, description: '讌ｭ蜍吝ｧ碑ｨ玲侭',
    document_id: 'receipt-001',
    line_id: null,
    status: 'exported',  // 蜃ｺ蜉帶ｸ医∩
    is_read: true,
    deleted_at: null,
    labels: ['INVOICE', 'INVOICE_QUALIFIED'],
    debit_entries: [
      { account: '螟匁ｳｨ雋ｻ', account_on_document: true, sub_account: null, amount: 150000, amount_on_document: true, tax_category_id: '隱ｲ遞惹ｻ募・ 10%' }
    ],
    credit_entries: [
      { account: '譎ｮ騾夐�宣≡', account_on_document: true, sub_account: '荳芽廠UFJ', amount: 150000, amount_on_document: true, tax_category_id: '蟇ｾ雎｡螟・ }
    ],
    rule_id: null,
    rule_confidence: null,
    invoice_status: 'qualified',
    invoice_number: 'T6666666666666',
    memo: null,
    memo_author: null,
    memo_target: null,
    memo_created_at: null,
    is_credit_card_payment: false
  },

  // 陦・0: JR逾樊虻邱壹�√Ν繝ｼ繝ｫ驕ｩ逕ｨ貂医∩縲・←譬ｼ隲区ｱよ嶌
  {
    id: 'jrn-00000010',
    display_order: 10,
    voucher_date: '2025-01-28', date_on_document: true,
    voucher_type: null, description: 'JR逾樊虻邱・,
    document_id: 'receipt-001',
    line_id: null,
    status: 'exported',  // 蜃ｺ蜉帶ｸ医∩
    is_read: true,
    deleted_at: null,
    labels: ['TRANSPORT', 'RULE_APPLIED', 'INVOICE_QUALIFIED', 'NEED_DOCUMENT', 'NEED_INFO'],  // 隍・焚繝輔Λ繧ｰ
    debit_entries: [
      { account: '譌・ｲｻ莠､騾夊ｲｻ', account_on_document: true, sub_account: null, amount: 320, amount_on_document: true, tax_category_id: '隱ｲ遞惹ｻ募・ 10%' }
    ],
    credit_entries: [
      { account: '迴ｾ驥・, account_on_document: true, sub_account: null, amount: 320, amount_on_document: true, tax_category_id: '蟇ｾ雎｡螟・ }
    ],
    rule_id: 'r008',
    rule_confidence: 0.93,
    invoice_status: 'qualified',
    invoice_number: 'T7777777777777',
    memo: null,
    memo_author: null,
    memo_target: null,
    memo_created_at: null,
    staff_notes: {
      ...createEmptyStaffNotes(),
      NEED_DOCUMENT: { enabled: true, text: '莠､騾夊ｲｻ縺ｮ鬆伜庶譖ｸ繧偵♀騾√ｊ縺上□縺輔＞', chatworkUrl: 'https://www.chatwork.com/#!rid00010' },
      NEED_INFO: { enabled: true, text: '陦後″蜈医ｒ謨吶∴縺ｦ縺上□縺輔＞', chatworkUrl: '' }
    },
    staff_notes_author: '螻ｱ逕ｰ螟ｪ驛・,
    is_credit_card_payment: false
  },

  // 陦・1: 繧ｪ繝輔ぅ繧ｹ逕｣遘代�√Ν繝ｼ繝ｫ驕ｩ逕ｨ貂医∩縲・←譬ｼ隲区ｱよ嶌
  {
    id: 'jrn-00000011',
    display_order: 11,
    voucher_date: '2025-01-29', date_on_document: true,
    voucher_type: null, description: '繧ｪ繝輔ぅ繧ｹ逕｣遘・,
    document_id: 'receipt-001',
    line_id: null,
    status: 'exported',  // 蜃ｺ蜉帶ｸ医∩
    is_read: true,
    deleted_at: null,
    labels: ['RECEIPT', 'INVOICE_QUALIFIED'],
    debit_entries: [
      { account: '蝨ｰ莉｣螳ｶ雉・, account_on_document: true, sub_account: '繧ｬ繝ｪ繝・Μ', amount: 6000, amount_on_document: true, tax_category_id: '繧ｯ繝ｬ繧ｸ繝・ヨ繧ｫ繝ｼ繝・ }
    ],
    credit_entries: [
      { account: '譛ｪ謇暮≡', account_on_document: true, sub_account: null, amount: 6000, amount_on_document: true, tax_category_id: '蟇ｾ雎｡螟・ }
    ],
    rule_id: null,
    rule_confidence: null,
    invoice_status: 'qualified',
    invoice_number: 'T8888888888888',
    memo: null,
    memo_author: null,
    memo_target: null,
    memo_created_at: null,
    is_credit_card_payment: false
  },

  // 陦・2: 豸郁�怜刀雋ｻ・医・繝ｻ荳�蜆ｿ繝壹Φ・峨�√Ν繝ｼ繝ｫ驕ｩ逕ｨ蜿ｯ閭ｽ縲・←譬ｼ隲区ｱよ嶌
  {
    id: 'jrn-00000012',
    display_order: 12,
    voucher_date: '2025-01-30', date_on_document: true,
    voucher_type: null, description: '豸郁�怜刀雋ｻ・医・繝ｼ繝ｫ繝壹Φ・・,
    document_id: 'receipt-001',
    line_id: null,
    status: 'exported',  // 蜃ｺ蜉帶ｸ医∩
    is_read: true,
    deleted_at: null,
    labels: ['RECEIPT', 'RULE_AVAILABLE', 'INVOICE_QUALIFIED'],
    debit_entries: [
      { account: '豸郁�怜刀雋ｻ', account_on_document: true, sub_account: null, amount: 800, amount_on_document: true, tax_category_id: '隱ｲ遞惹ｻ募・ 10%' }
    ],
    credit_entries: [
      { account: '迴ｾ驥・, account_on_document: true, sub_account: null, amount: 800, amount_on_document: true, tax_category_id: '蟇ｾ雎｡螟・ }
    ],
    rule_id: null,
    rule_confidence: null,
    invoice_status: 'qualified',
    invoice_number: 'T9999999999999',
    memo: null,
    memo_author: null,
    memo_target: null,
    memo_created_at: null,
    is_credit_card_payment: false
  },

  // 陦・3: 繧ｿ繧ｯ繧ｷ繝ｼ莉｣・井ｸ埼←譬ｼ驕矩�・ｼ峨�√Ν繝ｼ繝ｫ驕ｩ逕ｨ貂医∩縲∽ｸ埼←譬ｼ隲区ｱよ嶌
  {
    id: 'jrn-00000013',
    display_order: 13,
    voucher_date: '2025-01-31', date_on_document: true,
    voucher_type: null, description: '繧ｿ繧ｯ繧ｷ繝ｼ莉｣・井ｸ埼←譬ｼ驕矩�・ｼ・,
    document_id: 'receipt-001',
    line_id: null,
    status: 'exported',  // 蜃ｺ蜉帶ｸ医∩
    is_read: true,
    deleted_at: null,
    labels: ['TRANSPORT', 'RULE_APPLIED', 'INVOICE_NOT_QUALIFIED'],
    debit_entries: [
      { account: '譌・ｲｻ莠､騾夊ｲｻ', account_on_document: true, sub_account: null, amount: 750, amount_on_document: true, tax_category_id: '隱ｲ遞惹ｻ募・ 10%' }
    ],
    credit_entries: [
      { account: '迴ｾ驥・, account_on_document: true, sub_account: null, amount: 750, amount_on_document: true, tax_category_id: '蟇ｾ雎｡螟・ }
    ],
    rule_id: 'r011',
    rule_confidence: 0.85,
    invoice_status: 'not_qualified',
    invoice_number: null,
    memo: null,
    memo_author: null,
    memo_target: null,
    memo_created_at: null,
    is_credit_card_payment: false
  },

  // 陦・4: NTT繝峨さ繝｢縲・←譬ｼ隲区ｱよ嶌
  {
    id: 'jrn-00000014',
    display_order: 14,
    voucher_date: '2025-02-01', date_on_document: true,
    voucher_type: null, description: 'NTT繝峨さ繝｢',
    document_id: 'receipt-001',
    line_id: null,
    status: 'exported',  // 蜃ｺ蜉帶ｸ医∩
    is_read: true,
    deleted_at: null,
    labels: ['INVOICE', 'INVOICE_QUALIFIED'],
    debit_entries: [
      { account: '騾壻ｿ｡雋ｻ', account_on_document: true, sub_account: null, amount: 8000, amount_on_document: true, tax_category_id: '隱ｲ遞惹ｻ募・ 10%' }
    ],
    credit_entries: [
      { account: '譎ｮ騾夐�宣≡', account_on_document: true, sub_account: '荳芽廠UFJ', amount: 8000, amount_on_document: true, tax_category_id: '蟇ｾ雎｡螟・ }
    ],
    rule_id: null,
    rule_confidence: null,
    invoice_status: 'qualified',
    invoice_number: 'T0000000000001',
    memo: null,
    memo_author: null,
    memo_target: null,
    memo_created_at: null,
    is_credit_card_payment: true
  },

  // 陦・5: 謇区焚譁咎�壼ｸｳ雋ｻ縲・←譬ｼ隲区ｱよ嶌縲∬､・焚遞守紫
  {
    id: 'jrn-00000015',
    display_order: 15,
    voucher_date: '2025-02-01', date_on_document: true,
    voucher_type: null, description: '謇区焚譁咎�壼ｸｳ雋ｻ',
    document_id: 'receipt-001',
    line_id: null,
    status: 'exported',  // 蜃ｺ蜉帶ｸ医∩
    is_read: true,
    deleted_at: null,
    labels: ['RECEIPT', 'INVOICE_QUALIFIED', 'MULTI_TAX_RATE', 'EXPORT_EXCLUDE'],  // 蜃ｺ蜉帛ｯｾ雎｡螟・    debit_entries: [
      { account: '豸郁�怜刀雋ｻ', account_on_document: true, sub_account: null, amount: 0, amount_on_document: true, tax_category_id: '隱ｲ遞惹ｻ募・ 10%' }
    ],
    credit_entries: [
      { account: '迴ｾ驥・, account_on_document: true, sub_account: null, amount: 0, amount_on_document: true, tax_category_id: '蟇ｾ雎｡螟・ }
    ],
    rule_id: null,
    rule_confidence: null,
    invoice_status: 'qualified',
    invoice_number: 'T0000000000002',
    memo: null,
    memo_author: null,
    memo_target: null,
    memo_created_at: null,
    is_credit_card_payment: false
  },

  // 陦・6: 逾樊虻逧・ｱ・詞繧ｿ繧ｯ繧ｷ繝ｼ縲√Ν繝ｼ繝ｫ驕ｩ逕ｨ貂医∩縲・←譬ｼ隲区ｱよ嶌
  {
    id: 'jrn-00000016',
    display_order: 16,
    voucher_date: '2025-02-02', date_on_document: true,
    voucher_type: null, description: '逾樊虻逧・ｱ・詞繧ｿ繧ｯ繧ｷ繝ｼ',
    document_id: 'receipt-001',
    line_id: null,
    status: 'exported',  // 蜃ｺ蜉帶ｸ医∩
    is_read: true,
    deleted_at: null,
    labels: ['TRANSPORT', 'RULE_APPLIED', 'INVOICE_QUALIFIED'],
    debit_entries: [
      { account: '譌・ｲｻ莠､騾夊ｲｻ', account_on_document: true, sub_account: null, amount: 800, amount_on_document: true, tax_category_id: '隱ｲ遞惹ｻ募・ 10%' }
    ],
    credit_entries: [
      { account: '迴ｾ驥・, account_on_document: true, sub_account: null, amount: 800, amount_on_document: true, tax_category_id: '蟇ｾ雎｡螟・ }
    ],
    rule_id: 'r014',
    rule_confidence: 0.96,
    invoice_status: 'qualified',
    invoice_number: 'T0000000000003',
    memo: null,
    memo_author: null,
    memo_target: null,
    memo_created_at: null,
    is_credit_card_payment: false
  },

  // 陦・7: 雋ｷ蜿悶↓螳鈴ｹｿ驥應ｺ､蜿玖ｲｴ縲・←譬ｼ隲区ｱよ嶌
  {
    id: 'jrn-00000017',
    display_order: 17,
    voucher_date: '2025-02-02', date_on_document: true,
    voucher_type: null, description: '雋ｴ驥代↓螳鈴ｹｿ驥應ｺ､蜿玖ｲｴ',
    document_id: 'receipt-001',
    line_id: null,
    status: 'exported',  // 蜃ｺ蜉帶ｸ医∩
    is_read: true,
    deleted_at: null,
    labels: ['RECEIPT', 'INVOICE_QUALIFIED'],
    debit_entries: [
      { account: '豸郁�怜刀雋ｻ', account_on_document: true, sub_account: null, amount: 500000, amount_on_document: true, tax_category_id: '隱ｲ遞惹ｻ募・ 10%' }
    ],
    credit_entries: [
      { account: '譎ｮ騾夐�宣≡', account_on_document: true, sub_account: '荳芽廠UFJ', amount: 500000, amount_on_document: true, tax_category_id: '蟇ｾ雎｡螟・ }
    ],
    rule_id: null,
    rule_confidence: null,
    invoice_status: 'qualified',
    invoice_number: 'T0000000000004',
    memo: null,
    memo_author: null,
    memo_target: null,
    memo_created_at: null,
    is_credit_card_payment: false
  },

  // 陦・8: 荳榊庄蛻・栢縺榊屓縲・←譬ｼ隲区ｱよ嶌
  {
    id: 'jrn-00000018',
    display_order: 18,
    voucher_date: '2025-02-02', date_on_document: true,
    voucher_type: null, description: '荳榊庄蛻・栢縺榊屓',
    document_id: 'receipt-001',
    line_id: null,
    status: 'exported',  // 蜃ｺ蜉帶ｸ医∩
    is_read: true,
    deleted_at: null,
    labels: ['RECEIPT', 'INVOICE_QUALIFIED'],
    debit_entries: [
      { account: '鬟ｲ蜃ｺ鄒ｽ', account_on_document: true, sub_account: null, amount: 20000, amount_on_document: true, tax_category_id: '隱ｲ遞惹ｻ募・ 10%' }
    ],
    credit_entries: [
      { account: '迴ｾ驥・, account_on_document: true, sub_account: null, amount: 20000, amount_on_document: true, tax_category_id: '蟇ｾ雎｡螟・ }
    ],
    rule_id: null,
    rule_confidence: null,
    invoice_status: 'qualified',
    invoice_number: 'T0000000000005',
    memo: null,
    memo_author: null,
    memo_target: null,
    memo_created_at: null,
    is_credit_card_payment: false
  },

  // 陦・9: 莠倶ｾ句ｯｿ蛻､荳翫＞縺ｯ隧ｮ, 驕ｩ譬ｼ隲区ｱよ嶌
  {
    id: 'jrn-00000019',
    display_order: 19,
    voucher_date: '2025-02-03', date_on_document: true,
    voucher_type: null, description: '莠倶ｾ句ｯｿ蛻､荳翫＞縺ｯ隧ｮ',
    document_id: 'receipt-001',
    line_id: null,
    status: 'exported',  // 蜃ｺ蜉帶ｸ医∩
    is_read: true,
    deleted_at: null,
    labels: ['RECEIPT', 'INVOICE_QUALIFIED'],
    debit_entries: [
      { account: '豸郁�怜刀雋ｻ', account_on_document: true, sub_account: '迴ｾ驥・, amount: 50000, amount_on_document: true, tax_category_id: '隱ｲ遞惹ｻ募・ 10%' }
    ],
    credit_entries: [
      { account: '譎ｮ騾夐�宣≡', account_on_document: true, sub_account: '荳芽廠UFJ', amount: 50000, amount_on_document: true, tax_category_id: '蟇ｾ雎｡螟・ }
    ],
    rule_id: null,
    rule_confidence: null,
    invoice_status: 'qualified',
    invoice_number: 'T0000000000006',
    memo: null,
    memo_author: null,
    memo_target: null,
    memo_created_at: null,
    is_credit_card_payment: false
  },

  // 陦・0: 蠎・相螳｣莨晁ｲｻ・磯橿陦梧険霎ｼ・峨�・←譬ｼ隲区ｱよ嶌
  {
    id: 'jrn-00000020',
    display_order: 20,
    voucher_date: '2025-02-04', date_on_document: true,
    voucher_type: null, description: '蠎・相螳｣莨晁ｲｻ・磯橿陦梧険霎ｼ・・,
    document_id: 'receipt-001',
    line_id: null,
    status: 'exported',  // 蜃ｺ蜉帶ｸ医∩
    is_read: true,
    deleted_at: null,
    labels: ['BANK_STATEMENT', 'INVOICE_QUALIFIED', 'NEED_CONSULT', 'NEED_DOCUMENT'],  // 隍・焚繝輔Λ繧ｰ2
    debit_entries: [
      { account: '蠎・相螳｣莨晁ｲｻ', account_on_document: true, sub_account: '驫�陦・, amount: 100000, amount_on_document: true, tax_category_id: '隱ｲ遞惹ｻ募・ 10%' }
    ],
    credit_entries: [
      { account: '譎ｮ騾夐�宣≡', account_on_document: true, sub_account: '荳芽廠UFJ', amount: 100000, amount_on_document: true, tax_category_id: '蟇ｾ雎｡螟・ }
    ],
    rule_id: null,
    rule_confidence: null,
    invoice_status: 'qualified',
    invoice_number: 'T0000000000007',
    memo: null,
    memo_author: null,
    memo_target: null,
    memo_created_at: null,
    staff_notes: {
      ...createEmptyStaffNotes(),
      NEED_CONSULT: { enabled: true, text: '蠎・相螳｣莨晁ｲｻ縺ｮ險井ｸ翫↓縺､縺・※逶ｸ隲・＠縺溘＞', chatworkUrl: 'https://www.chatwork.com/#!rid00020' },
      NEED_DOCUMENT: { enabled: true, text: '螂醍ｴ・嶌縺ｮ繧ｳ繝斐・繧偵♀騾√ｊ縺上□縺輔＞', chatworkUrl: '' }
    },
    staff_notes_author: '菴占陸闃ｱ蟄・,
    is_credit_card_payment: false
  },

  // 陦・1: 讌ｭ蜍吝ｧ碑ｨ玲侭縲・←譬ｼ隲区ｱよ嶌・亥・蜉帶ｸ医∩・・  {
    id: 'jrn-00000021',
    display_order: 21,
    voucher_date: '2025-02-05', date_on_document: true,
    voucher_type: null, description: '讌ｭ蜍吝ｧ碑ｨ玲侭',
    document_id: 'receipt-001',
    line_id: null,
    status: 'exported',
    is_read: true,
    deleted_at: null,
    labels: ['RECEIPT', 'INVOICE_QUALIFIED'],
    debit_entries: [
      { account: '螟匁ｳｨ雋ｻ', account_on_document: true, sub_account: null, amount: 8000, amount_on_document: true, tax_category_id: '隱ｲ遞惹ｻ募・ 10%' }
    ],
    credit_entries: [
      { account: '譎ｮ騾夐�宣≡', account_on_document: true, sub_account: '荳芽廠UFJ', amount: 8000, amount_on_document: true, tax_category_id: '蟇ｾ雎｡螟・ }
    ],
    rule_id: null,
    rule_confidence: null,
    invoice_status: 'qualified',
    invoice_number: 'T0000000000008',
    memo: null,
    memo_author: null,
    memo_target: null,
    memo_created_at: null,
    is_credit_card_payment: false
  },

  // ============================================================
  // 陦・2-30: 繧､繧ｨ繝ｭ繝ｼ・域悴隱ｭ縲∽ｺ区腐繝輔Λ繧ｰ縲√し繝昴・繝井ｾ晞�ｼ・・  // ============================================================

  // 陦・2: OCR菫｡鬆ｼ蠎ｦ菴弱�∵悴隱ｭ
  {
    id: 'jrn-00000022',
    display_order: 22,
    voucher_date: '2025-02-06', date_on_document: true,
    voucher_type: null, description: '雉・侭菴懈・譁・,
    document_id: 'receipt-001',
    line_id: null,
    status: null,
    is_read: true,  // 譌｢隱ｭ
    deleted_at: '2026-02-21T00:00:00Z',  // 繧ｴ繝溽ｮｱ・域､懆ｨｼ逕ｨ・・    labels: ['RECEIPT', 'UNREADABLE_ESTIMATED'],
    debit_entries: [
      { account: '豸郁�怜刀雋ｻ', account_on_document: true, sub_account: null, amount: 10000, amount_on_document: true, tax_category_id: '隱ｲ遞惹ｻ募・ 10%' }
    ],
    credit_entries: [
      { account: '迴ｾ驥・, account_on_document: true, sub_account: null, amount: 10000, amount_on_document: true, tax_category_id: '蟇ｾ雎｡螟・ }
    ],
    rule_id: null,
    rule_confidence: null,
    invoice_status: null,
    invoice_number: null,
    memo: null,
    memo_author: null,
    memo_target: null,
    memo_created_at: null,
    is_credit_card_payment: false
  },

  // 陦・3: 驥崎､・桝縺・�∵悴隱ｭ
  {
    id: 'jrn-00000023',
    display_order: 23,
    voucher_date: '2025-02-07', date_on_document: true,
    voucher_type: null, description: '荳肴・縺ｪ謖ｯ繧・,
    document_id: 'receipt-001',
    line_id: null,
    status: null,
    is_read: true,  // 譌｢隱ｭ
    deleted_at: '2026-02-21T00:00:00Z',  // 繧ｴ繝溽ｮｱ・域､懆ｨｼ逕ｨ・・    labels: ['TRANSPORT', 'DUPLICATE_SUSPECT', 'DUPLICATE_CONFIRMED'],
    debit_entries: [
      { account: '譌・ｲｻ莠､騾夊ｲｻ', account_on_document: true, sub_account: null, amount: 9000, amount_on_document: true, tax_category_id: '隱ｲ遞惹ｻ募・ 10%' }
    ],
    credit_entries: [
      { account: '迴ｾ驥・, account_on_document: true, sub_account: null, amount: 9000, amount_on_document: true, tax_category_id: '蟇ｾ雎｡螟・ }
    ],
    rule_id: null,
    rule_confidence: null,
    invoice_status: null,
    invoice_number: null,
    memo: null,
    memo_author: null,
    memo_target: null,
    memo_created_at: null,
    is_credit_card_payment: false
  },

  // 陦・4: 譌･莉倡焚蟶ｸ縲∵悴隱ｭ
  {
    id: 'jrn-00000024',
    display_order: 24,
    voucher_date: '2026-12-31', date_on_document: true,
    voucher_type: null, description: '譛ｪ譚･譌･莉倥・莉戊ｨｳ',
    document_id: 'receipt-001',
    line_id: null,
    status: null,
    is_read: false,
    deleted_at: null,
    labels: ['RECEIPT', 'DATE_OUT_OF_RANGE'],
    debit_entries: [
      { account: '豸郁�怜刀雋ｻ', account_on_document: true, sub_account: null, amount: 11000, amount_on_document: true, tax_category_id: '隱ｲ遞惹ｻ募・ 10%' }
    ],
    credit_entries: [
      { account: '迴ｾ驥・, account_on_document: true, sub_account: null, amount: 11000, amount_on_document: true, tax_category_id: '蟇ｾ雎｡螟・ }
    ],
    rule_id: null,
    rule_confidence: null,
    invoice_status: null,
    invoice_number: null,
    memo: null,
    memo_author: null,
    memo_target: null,
    memo_created_at: null,
    is_credit_card_payment: false
  },

  // 陦・5: 驥鷹｡肱ull・・n_document=true: 鬆・岼縺ｯ縺ゅｋ縺瑚ｪｭ繧√↑縺九▲縺滂ｼ峨�∬､・焚險ｼ逾ｨ縺ゅｊ縲∵悴隱ｭ
  {
    id: 'jrn-00000025',
    display_order: 25,
    voucher_date: '2025-02-08', date_on_document: true,
    voucher_type: null, description: '逡ｰ蟶ｸ驥鷹｡・,
    document_id: 'receipt-001',
    line_id: null,
    status: null,
    is_read: false,
    deleted_at: null,
    labels: ['RECEIPT', 'AMOUNT_UNCLEAR', 'MULTIPLE_VOUCHERS'],
    debit_entries: [
      { account: '豸郁�怜刀雋ｻ', account_on_document: true, sub_account: null, amount: null, amount_on_document: true, tax_category_id: '隱ｲ遞惹ｻ募・ 10%' }
    ],
    credit_entries: [
      { account: '迴ｾ驥・, account_on_document: true, sub_account: null, amount: null, amount_on_document: true, tax_category_id: '蟇ｾ雎｡螟・ }
    ],
    rule_id: null,
    rule_confidence: null,
    invoice_status: null,
    invoice_number: null,
    memo: null,
    memo_author: null,
    memo_target: null,
    memo_created_at: null,
    is_credit_card_payment: false
  },

  // 陦・6: 繧ｵ繝昴・繝井ｾ晞�ｼ・・elp・峨�√Γ繝｢縺ゅｊ縲∵悴隱ｭ
  {
    id: 'jrn-00000026',
    display_order: 26,
    voucher_date: '2025-02-05', date_on_document: true,
    voucher_type: null, description: '雉・侭謖√■',
    document_id: 'receipt-001',
    line_id: null,
    status: null,
    is_read: false,
    deleted_at: null,
    labels: ['RECEIPT', 'MEMO_DETECTED', 'NEED_CONSULT'],  // 譌ｧhelp 竊・逶ｸ隲・′蠢・ｦ・    debit_entries: [
      { account: '豸郁�怜刀雋ｻ', account_on_document: true, sub_account: null, amount: 8000, amount_on_document: true, tax_category_id: '隱ｲ遞惹ｻ募・ 10%' }
    ],
    credit_entries: [
      { account: '迴ｾ驥・, account_on_document: true, sub_account: null, amount: 8000, amount_on_document: true, tax_category_id: '蟇ｾ雎｡螟・ }
    ],
    rule_id: null,
    rule_confidence: null,
    invoice_status: null,
    invoice_number: null,
    memo: '縺薙・莉戊ｨｳ縺御ｽ輔°繧上°繧翫∪縺帙ｓ縲ょ勧縺代※縺上□縺輔＞縲・,
    memo_author: '螻ｱ逕ｰ螟ｪ驛・,
    memo_target: '菴占陸闃ｱ蟄・,
    memo_created_at: '2025-02-08T10:00:00Z',
    staff_notes: {
      ...createEmptyStaffNotes(),
      NEED_CONSULT: { enabled: true, text: '蜍伜ｮ夂ｧ醍岼縺御ｸ肴・縺ｧ縺・, chatworkUrl: '' }
    },
    staff_notes_author: '螻ｱ逕ｰ螟ｪ驛・,
    is_credit_card_payment: false
  },

  // 陦・7: 逶ｸ隲・ｼ・oudan・峨�√Γ繝｢縺ゅｊ縲∵悴隱ｭ
  {
    id: 'jrn-00000027',
    display_order: 27,
    voucher_date: '2025-02-07', date_on_document: true,
    voucher_type: null, description: '譚先侭雋ｻ繝ｻ隱ｿ謨ｴ遲・,
    document_id: 'receipt-001',
    line_id: null,
    status: null,
    is_read: false,
    deleted_at: null,
    labels: ['INVOICE', 'MEMO_DETECTED', 'NEED_CONSULT'],  // 譌ｧsoudan 竊・逶ｸ隲・′蠢・ｦ・    debit_entries: [
      { account: '豸郁�怜刀雋ｻ', account_on_document: true, sub_account: null, amount: 11000, amount_on_document: true, tax_category_id: '隱ｲ遞惹ｻ募・ 10%' }
    ],
    credit_entries: [
      { account: '迴ｾ驥・, account_on_document: true, sub_account: null, amount: 11000, amount_on_document: true, tax_category_id: '蟇ｾ雎｡螟・ }
    ],
    rule_id: null,
    rule_confidence: null,
    invoice_status: null,
    invoice_number: null,
    memo: '縺薙・驥鷹｡阪〒蜷医▲縺ｦ縺・∪縺吶°・溽｢ｺ隱阪＠縺ｦ縺上□縺輔＞縲・,
    memo_author: '驤ｴ譛ｨ荳�驛・,
    memo_target: '逕ｰ荳ｭ谺｡驛・,
    memo_created_at: '2025-02-08T14:00:00Z',
    staff_notes: {
      ...createEmptyStaffNotes(),
      NEED_CONSULT: { enabled: true, text: '驥鷹｡阪・遒ｺ隱阪ｒ縺企｡倥＞縺励∪縺・, chatworkUrl: 'https://www.chatwork.com/#!rid00027' },
      REMINDER: { enabled: true, text: '譚･譛亥・遒ｺ隱・, chatworkUrl: '' }
    },
    staff_notes_author: '驤ｴ譛ｨ荳�驛・,
    is_credit_card_payment: false
  },

  // 陦・8: 譌･莉蕨ull・・n_document=true: 譌･莉俶ｬ・・縺ゅｋ縺瑚ｪｭ繧√↑縺九▲縺滂ｼ峨�√Γ繝｢縺ゅｊ縲∵悴隱ｭ
  {
    id: 'jrn-00000028',
    display_order: 28,
    voucher_date: null, date_on_document: true,
    voucher_type: null, description: '迴ｾ驥鷹�伜庶驕・ｌ縺帙ｌ莉ｮ謇輔＞',
    document_id: 'receipt-001',
    line_id: null,
    status: null,
    is_read: false,
    deleted_at: null,
    labels: ['RECEIPT', 'DATE_UNKNOWN', 'MEMO_DETECTED', 'NEED_DOCUMENT'],  // 譌･莉倅ｸ肴・ + 謇区嶌縺阪Γ繝｢ + 雉・侭縺悟ｿ・ｦ・    debit_entries: [
      { account: '譌・ｲｻ莠､騾夊ｲｻ', account_on_document: true, sub_account: null, amount: 5000, amount_on_document: true, tax_category_id: '隱ｲ遞惹ｻ募・ 10%' }
    ],
    credit_entries: [
      { account: '迴ｾ驥・, account_on_document: true, sub_account: null, amount: 5000, amount_on_document: true, tax_category_id: '蟇ｾ雎｡螟・ }
    ],
    rule_id: null,
    rule_confidence: null,
    invoice_status: null,
    invoice_number: null,
    memo: '鬆伜庶譖ｸ縺瑚ｦ九▽縺九ｊ縺ｾ縺帙ｓ縺ｧ縺励◆縲ょ・逋ｺ陦後ｒ萓晞�ｼ荳ｭ縺ｧ縺吶�・,
    memo_author: '鬮俶ｩ狗ｾ主調',
    memo_target: '莨願陸蛛･螟ｪ',
    memo_created_at: '2025-02-08T15:00:00Z',
    staff_notes: {
      ...createEmptyStaffNotes(),
      NEED_DOCUMENT: { enabled: true, text: '鬆伜庶譖ｸ縺ｮ蜀咲匱陦後ｒ萓晞�ｼ荳ｭ縺ｧ縺・, chatworkUrl: 'https://www.chatwork.com/#!rid00028' }
    },
    staff_notes_author: '鬮俶ｩ狗ｾ主調',
    is_credit_card_payment: false
  },

  // 陦・9: 雋ｸ蛟滉ｸ堺ｸ�閾ｴ縲∵悴隱ｭ
  {
    id: 'jrn-00000029',
    display_order: 29,
    voucher_date: '2025-02-09', date_on_document: true,
    voucher_type: null, description: '蜈･蜉帙Α繧ｹ萓・,
    document_id: 'receipt-001',
    line_id: null,
    status: null,
    is_read: false,
    deleted_at: null,
    labels: ['RECEIPT', 'DEBIT_CREDIT_MISMATCH'],
    debit_entries: [
      { account: '豸郁�怜刀雋ｻ', account_on_document: true, sub_account: null, amount: 5000, amount_on_document: true, tax_category_id: '隱ｲ遞惹ｻ募・ 10%' }
    ],
    credit_entries: [
      { account: '迴ｾ驥・, account_on_document: true, sub_account: null, amount: 4999, amount_on_document: true, tax_category_id: '蟇ｾ雎｡螟・ }
    ],
    rule_id: null,
    rule_confidence: null,
    invoice_status: null,
    invoice_number: null,
    memo: null,
    memo_author: null,
    memo_target: null,
    memo_created_at: null,
    is_credit_card_payment: false
  },

  // 陦・0: 蜍伜ｮ夂ｧ醍岼null・・n_document=false: 險ｼ諞代↓蜍伜ｮ夂ｧ醍岼縺ｮ險倩ｼ峨↑縺暦ｼ峨�∬ｲｸ蛟滉ｸ堺ｸ�閾ｴ縲∵悴隱ｭ
  {
    id: 'jrn-00000030',
    display_order: 30,
    voucher_date: '2025-02-10', date_on_document: true,
    voucher_type: null, description: '險育ｮ苓ｪ､蟾ｮ萓・,
    document_id: 'receipt-001',
    line_id: null,
    status: null,
    is_read: false,
    deleted_at: null,
    labels: ['INVOICE', 'ACCOUNT_UNKNOWN', 'DEBIT_CREDIT_MISMATCH'],
    debit_entries: [
      { account: null, account_on_document: false, sub_account: null, amount: 10000, amount_on_document: true, tax_category_id: '隱ｲ遞惹ｻ募・ 10%' }
    ],
    credit_entries: [
      { account: null, account_on_document: false, sub_account: null, amount: 10001, amount_on_document: true, tax_category_id: '蟇ｾ雎｡螟・ }
    ],
    rule_id: null,
    rule_confidence: null,
    invoice_status: null,
    invoice_number: null,
    memo: null,
    memo_author: null,
    memo_target: null,
    memo_created_at: null,
    is_credit_card_payment: false
  },

  // ============================================================
  // 陦・1-35: 隍・粋莉戊ｨｳ繝・せ繝医ョ繝ｼ繧ｿ・・owspan讀懆ｨｼ逕ｨ・・  // ============================================================

  // 陦・1: 1蟇ｾ2隍・粋莉戊ｨｳ・育ｵ瑚ｲｻ邊ｾ邂・竊・迴ｾ驥・繧ｯ繝ｬ繧ｸ繝・ヨ繧ｫ繝ｼ繝会ｼ・  {
    id: 'jrn-00000031',
    display_order: 31,
    voucher_date: '2025-02-11', date_on_document: true,
    voucher_type: null, description: '繧ｿ繧ｯ繧ｷ繝ｼ莉｣・育ｵ瑚ｲｻ邊ｾ邂暦ｼ・,
    document_id: 'receipt-001',
    line_id: null,
    status: null,
    is_read: true,
    deleted_at: null,
    labels: ['TRANSPORT', 'RULE_APPLIED', 'INVOICE_QUALIFIED'],
    debit_entries: [
      { account: '譌・ｲｻ莠､騾夊ｲｻ', account_on_document: true, sub_account: null, amount: 5000, amount_on_document: true, tax_category_id: '隱ｲ遞惹ｻ募・ 10%' }
    ],
    credit_entries: [
      { account: '迴ｾ驥・, account_on_document: true, sub_account: null, amount: 3000, amount_on_document: true, tax_category_id: '蟇ｾ雎｡螟・ },
      { account: '譛ｪ謇暮≡', account_on_document: true, sub_account: '繧ｯ繝ｬ繧ｸ繝・ヨ繧ｫ繝ｼ繝・, amount: 2000, amount_on_document: true, tax_category_id: '蟇ｾ雎｡螟・ }
    ],
    rule_id: 'r021',
    rule_confidence: 0.88,
    invoice_status: 'qualified',
    invoice_number: 'T0000000000009',
    memo: null,
    memo_author: null,
    memo_target: null,
    memo_created_at: null,
    is_credit_card_payment: false
  },

  // 陦・2: 2蟇ｾ1隍・粋莉戊ｨｳ・井ｺ､騾夊ｲｻ+螳ｿ豕願ｲｻ 竊・繧ｯ繝ｬ繧ｸ繝・ヨ繧ｫ繝ｼ繝会ｼ・  {
    id: 'jrn-00000032',
    display_order: 32,
    voucher_date: '2025-02-12', date_on_document: true,
    voucher_type: null, description: '蜃ｺ蠑ｵ雋ｻ逕ｨ・井ｺ､騾夊ｲｻ+螳ｿ豕願ｲｻ・・,
    document_id: 'receipt-001',
    line_id: null,
    status: null,
    is_read: true,
    deleted_at: null,
    labels: ['CREDIT_CARD', 'INVOICE_QUALIFIED'],
    debit_entries: [
      { account: '譌・ｲｻ莠､騾夊ｲｻ', account_on_document: true, sub_account: '莠､騾夊ｲｻ', amount: 8000, amount_on_document: true, tax_category_id: '隱ｲ遞惹ｻ募・ 10%' },
      { account: '譌・ｲｻ莠､騾夊ｲｻ', account_on_document: true, sub_account: '螳ｿ豕願ｲｻ', amount: 12000, amount_on_document: true, tax_category_id: '隱ｲ遞惹ｻ募・ 10%' }
    ],
    credit_entries: [
      { account: '譛ｪ謇暮≡', account_on_document: true, sub_account: '繧ｯ繝ｬ繧ｸ繝・ヨ繧ｫ繝ｼ繝・, amount: 20000, amount_on_document: true, tax_category_id: '蟇ｾ雎｡螟・ }
    ],
    rule_id: null,
    rule_confidence: null,
    invoice_status: 'qualified',
    invoice_number: 'T0000000000010',
    memo: null,
    memo_author: null,
    memo_target: null,
    memo_created_at: null,
    is_credit_card_payment: true
  },

  // 陦・3: 1蟇ｾ3隍・粋莉戊ｨｳ・育ｵｦ荳・竊・迴ｾ驥・遉ｾ莨壻ｿ晞匱譁・貅先ｳ牙ｾｴ蜿守ｨ趣ｼ・  {
    id: 'jrn-00000033',
    display_order: 33,
    voucher_date: '2025-02-13', date_on_document: true,
    voucher_type: null, description: '邨ｦ荳取髪謇包ｼ亥ｱｱ逕ｰ螟ｪ驛趣ｼ・,
    document_id: 'receipt-001',
    line_id: null,
    status: null,
    is_read: true,
    deleted_at: null,
    labels: ['BANK_STATEMENT', 'INVOICE_QUALIFIED'],
    debit_entries: [
      { account: '邨ｦ譁呎焔蠖・, account_on_document: true, sub_account: null, amount: 300000, amount_on_document: true, tax_category_id: '蟇ｾ雎｡螟・ }
    ],
    credit_entries: [
      { account: '譎ｮ騾夐�宣≡', account_on_document: true, sub_account: '荳芽廠UFJ', amount: 250000, amount_on_document: true, tax_category_id: '蟇ｾ雎｡螟・ },
      { account: '鬆舌ｊ驥・, account_on_document: true, sub_account: '遉ｾ莨壻ｿ晞匱譁・, amount: 30000, amount_on_document: true, tax_category_id: '蟇ｾ雎｡螟・ },
      { account: '鬆舌ｊ驥・, account_on_document: true, sub_account: '貅先ｳ牙ｾｴ蜿守ｨ・, amount: 20000, amount_on_document: true, tax_category_id: '蟇ｾ雎｡螟・ }
    ],
    rule_id: null,
    rule_confidence: null,
    invoice_status: 'qualified',
    invoice_number: 'T0000000000011',
    memo: null,
    memo_author: null,
    memo_target: null,
    memo_created_at: null,
    is_credit_card_payment: false
  },

  // 陦・4: 1蟇ｾ10隍・粋莉戊ｨｳ・育ｵ瑚ｲｻ邊ｾ邂・竊・10鬆・岼縺ｮ蜀・ｨｳ・・  {
    id: 'jrn-00000034',
    display_order: 34,
    voucher_date: '2025-02-14', date_on_document: true,
    voucher_type: null, description: '邨瑚ｲｻ邊ｾ邂暦ｼ域・邏ｰ10鬆・岼・・,
    document_id: 'receipt-001',
    line_id: null,
    status: null,
    is_read: true,
    deleted_at: null,
    labels: ['RECEIPT', 'INVOICE_QUALIFIED'],
    debit_entries: [
      { account: '邨瑚ｲｻ邊ｾ邂・, account_on_document: true, sub_account: null, amount: 55000, amount_on_document: true, tax_category_id: '隱ｲ遞惹ｻ募・ 10%' }
    ],
    credit_entries: [
      { account: '迴ｾ驥・, account_on_document: true, sub_account: '鬆・岼1', amount: 5000, amount_on_document: true, tax_category_id: '蟇ｾ雎｡螟・ },
      { account: '迴ｾ驥・, account_on_document: true, sub_account: '鬆・岼2', amount: 5000, amount_on_document: true, tax_category_id: '蟇ｾ雎｡螟・ },
      { account: '迴ｾ驥・, account_on_document: true, sub_account: '鬆・岼3', amount: 5000, amount_on_document: true, tax_category_id: '蟇ｾ雎｡螟・ },
      { account: '迴ｾ驥・, account_on_document: true, sub_account: '鬆・岼4', amount: 5000, amount_on_document: true, tax_category_id: '蟇ｾ雎｡螟・ },
      { account: '迴ｾ驥・, account_on_document: true, sub_account: '鬆・岼5', amount: 5000, amount_on_document: true, tax_category_id: '蟇ｾ雎｡螟・ },
      { account: '迴ｾ驥・, account_on_document: true, sub_account: '鬆・岼6', amount: 5000, amount_on_document: true, tax_category_id: '蟇ｾ雎｡螟・ },
      { account: '迴ｾ驥・, account_on_document: true, sub_account: '鬆・岼7', amount: 5000, amount_on_document: true, tax_category_id: '蟇ｾ雎｡螟・ },
      { account: '迴ｾ驥・, account_on_document: true, sub_account: '鬆・岼8', amount: 5000, amount_on_document: true, tax_category_id: '蟇ｾ雎｡螟・ },
      { account: '迴ｾ驥・, account_on_document: true, sub_account: '鬆・岼9', amount: 5000, amount_on_document: true, tax_category_id: '蟇ｾ雎｡螟・ },
      { account: '迴ｾ驥・, account_on_document: true, sub_account: '鬆・岼10', amount: 5000, amount_on_document: true, tax_category_id: '蟇ｾ雎｡螟・ }
    ],
    rule_id: null,
    rule_confidence: null,
    invoice_status: 'qualified',
    invoice_number: 'T0000000000012',
    memo: null,
    memo_author: null,
    memo_target: null,
    memo_created_at: null,
    is_credit_card_payment: false
  },

  // 陦・5: 3蟇ｾ3隍・粋莉戊ｨｳ・・蟇ｾN縲∵ｱｺ邂嶺ｻ戊ｨｳ・・  {
    id: 'jrn-00000035',
    display_order: 35,
    voucher_date: '2025-02-15', date_on_document: true,
    voucher_type: null, description: '豎ｺ邂嶺ｻ戊ｨｳ・郁ｲｻ逕ｨ謖ｯ譖ｿ・・,
    document_id: 'receipt-001',
    line_id: null,
    status: null,
    is_read: true,
    deleted_at: null,
    labels: ['INVOICE', 'INVOICE_QUALIFIED'],
    debit_entries: [
      { account: '螢ｲ荳雁次萓｡', account_on_document: true, sub_account: '譚先侭雋ｻ', amount: 100000, amount_on_document: true, tax_category_id: '隱ｲ遞惹ｻ募・ 10%' },
      { account: '螢ｲ荳雁次萓｡', account_on_document: true, sub_account: '蜉ｴ蜍呵ｲｻ', amount: 150000, amount_on_document: true, tax_category_id: '蟇ｾ雎｡螟・ },
      { account: '螢ｲ荳雁次萓｡', account_on_document: true, sub_account: '邨瑚ｲｻ', amount: 50000, amount_on_document: true, tax_category_id: '隱ｲ遞惹ｻ募・ 10%' }
    ],
    credit_entries: [
      { account: '莉墓寺蜩・, account_on_document: true, sub_account: '譚先侭雋ｻ', amount: 100000, amount_on_document: true, tax_category_id: '蟇ｾ雎｡螟・ },
      { account: '莉墓寺蜩・, account_on_document: true, sub_account: '蜉ｴ蜍呵ｲｻ', amount: 150000, amount_on_document: true, tax_category_id: '蟇ｾ雎｡螟・ },
      { account: '莉墓寺蜩・, account_on_document: true, sub_account: '邨瑚ｲｻ', amount: 50000, amount_on_document: true, tax_category_id: '蟇ｾ雎｡螟・ }
    ],
    rule_id: null,
    rule_confidence: null,
    invoice_status: 'qualified',
    invoice_number: 'T0000000000013',
    memo: null,
    memo_author: null,
    memo_target: null,
    memo_created_at: null,
    is_credit_card_payment: false
  }
];
