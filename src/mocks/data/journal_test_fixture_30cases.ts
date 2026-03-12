/**
 * Phase 5 テストフィクスチャ（30件 + 複合仕訳5件 = 35件。件数は今後増減する）
 *
 * 目的: UIモック検証、フロントエンド実装、バックエンド実装で使用
 * 参照: phase5_level3_test_fixture_30cases_260214.md.resolved
 * 更新: 2026-02-15 - status値をexportedのみに変更、要対応ラベル追加
 */

import type { JournalPhase5Mock } from '../types/journal_phase5_mock.type';
import { createEmptyStaffNotes } from '../types/staff_notes';

export const mockJournalsPhase5: JournalPhase5Mock[] = [
  // ============================================================
  // 行1-10: グリーン（正常、バリエーション豊富）
  // ============================================================

  // 行1: 交通費（タクシー）、ルール適用済み、適格請求書
  {
    id: 'jrn-00000001',
    display_order: 1,
    transaction_date: '2024-07-29', date_on_document: true,
    description: '神戸相互タクシー',
    document_id: 'receipt-001',
    status: 'exported',  // 出力済み
    is_read: true,
    deleted_at: null,
    labels: ['TRANSPORT', 'RULE_APPLIED', 'INVOICE_QUALIFIED'],
    debit_entries: [
      { account: '旅費交通費', account_on_document: true, sub_account: null, amount: 800, amount_on_document: true, tax_category_id: '課税仕入 10%' }
    ],
    credit_entries: [
      { account: '現金', account_on_document: true, sub_account: null, amount: 800, amount_on_document: true, tax_category_id: '対象外' }
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

  // 行2: レシート、ルール適用可能、不適格請求書
  {
    id: 'jrn-00000002',
    display_order: 2,
    transaction_date: '2025-01-20', date_on_document: true,
    description: 'VIVACE BEAUTYクリニック',
    document_id: 'receipt-001',
    status: 'exported',  // 出力済み
    is_read: false,  // 未読（黄色背景）
    deleted_at: null,
    labels: ['RECEIPT', 'RULE_AVAILABLE', 'INVOICE_NOT_QUALIFIED', 'NEED_DOCUMENT'],  // 書類が不足
    debit_entries: [
      { account: 'メンテナンス費', account_on_document: true, sub_account: null, amount: 11000, amount_on_document: true, tax_category_id: '課税仕入 10%' }
    ],
    credit_entries: [
      { account: '現金', account_on_document: true, sub_account: null, amount: 11000, amount_on_document: true, tax_category_id: '対象外' }
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
      NEED_DOCUMENT: { enabled: true, text: '請求書の原本をお送りください', chatworkUrl: 'https://www.chatwork.com/#!rid00001' }
    },
    staff_notes_author: '山田太郎',
    is_credit_card_payment: false
  },

  // 行3: レシート、ルール適用済み、適格請求書
  {
    id: 'jrn-00000003',
    display_order: 3,
    transaction_date: '2025-01-21', date_on_document: true,
    description: 'コピー用紙',
    document_id: 'receipt-001',
    status: 'exported',  // 出力済み
    is_read: false,  // 未読（黄色背景）
    deleted_at: null,
    labels: ['RECEIPT', 'INVOICE_QUALIFIED', 'NEED_INFO'],  // 情報が不足（旧NEED_CONFIRM）
    debit_entries: [
      { account: '消耗品費', account_on_document: true, sub_account: null, amount: 2500, amount_on_document: true, tax_category_id: '課税仕入 10%' }
    ],
    credit_entries: [
      { account: '現金', account_on_document: true, sub_account: null, amount: 2500, amount_on_document: true, tax_category_id: '対象外' }
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
      NEED_INFO: { enabled: true, text: 'この仕訳の内容で合っていますか？', chatworkUrl: '' }
    },
    staff_notes_author: '佐藤花子',
    is_credit_card_payment: false
  },

  // 行4: 文房具セット、ルール適用済み、適格請求書
  {
    id: 'jrn-00000004',
    display_order: 4,
    transaction_date: '2025-01-22', date_on_document: true,
    description: '文房具セット',
    document_id: 'receipt-001',
    status: 'exported',  // 出力済み
    is_read: true,
    deleted_at: null,
    labels: ['CREDIT_CARD', 'INVOICE_QUALIFIED'],
    debit_entries: [
      { account: '消耗品費', account_on_document: true, sub_account: null, amount: 3200, amount_on_document: true, tax_category_id: '課税仕入 10%' }
    ],
    credit_entries: [
      { account: '未払金', account_on_document: true, sub_account: null, amount: 3200, amount_on_document: true, tax_category_id: '対象外' }
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

  // 行5: タクシー代（不適格運送）、ルール適用済み、適格請求書
  {
    id: 'jrn-00000005',
    display_order: 5,
    transaction_date: '2025-01-23', date_on_document: true,
    description: 'タクシー代（不適格運送）',
    document_id: 'receipt-001',
    status: 'exported',  // 出力済み
    is_read: true,
    deleted_at: null,
    labels: ['BANK_STATEMENT', 'RULE_APPLIED', 'INVOICE_QUALIFIED', 'NEED_CONSULT'],  // 社内相談する
    debit_entries: [
      { account: '旅費交通費', account_on_document: true, sub_account: null, amount: 650, amount_on_document: true, tax_category_id: '課税仕入 10%' }
    ],
    credit_entries: [
      { account: '普通預金', account_on_document: true, sub_account: '三菱UFJ', amount: 650, amount_on_document: true, tax_category_id: '対象外' }
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
      NEED_CONSULT: { enabled: true, text: '税務処理の判断に迷いがあります', chatworkUrl: 'https://www.chatwork.com/#!rid00005' }
    },
    staff_notes_author: '鈴木一郎',
    is_credit_card_payment: false
  },

  // 行6: タクシー代、ルール適用済み、適格請求書
  {
    id: 'jrn-00000006',
    display_order: 6,
    transaction_date: '2025-01-24', date_on_document: true,
    description: 'タクシー代',
    document_id: 'receipt-001',
    status: 'exported',  // 出力済み
    is_read: true,
    deleted_at: null,
    labels: ['TRANSPORT', 'RULE_APPLIED', 'INVOICE_QUALIFIED'],
    debit_entries: [
      { account: '旅費交通費', account_on_document: true, sub_account: null, amount: 1500, amount_on_document: true, tax_category_id: '課税仕入 10%' }
    ],
    credit_entries: [
      { account: '現金', account_on_document: true, sub_account: null, amount: 1500, amount_on_document: true, tax_category_id: '対象外' }
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

  // 行7: 電気代（関西電力）、ルール適用済み、適格請求書Note: 適格請求書が発行されたため、適格請求書
  {
    id: 'jrn-00000007',
    display_order: 7,
    transaction_date: '2025-01-25', date_on_document: true,
    description: '電気代 関西電力',
    document_id: 'receipt-001',
    status: 'exported',  // 出力済み
    is_read: true,
    deleted_at: null,
    labels: ['INVOICE', 'RULE_APPLIED', 'INVOICE_QUALIFIED'],
    debit_entries: [
      { account: '水道光熱費', account_on_document: true, sub_account: '電気代', amount: 12000, amount_on_document: true, tax_category_id: '課税仕入 10%' }
    ],
    credit_entries: [
      { account: '普通預金', account_on_document: true, sub_account: '三菱UFJ', amount: 12000, amount_on_document: true, tax_category_id: '対象外' }
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

  // 行8: スターバックス、ルール適用済み、適格請求書
  {
    id: 'jrn-00000008',
    display_order: 8,
    transaction_date: '2025-01-26', date_on_document: true,
    description: 'スターバックス',
    document_id: 'receipt-001',
    status: 'exported',  // 出力済み
    is_read: true,
    deleted_at: null,
    labels: ['RECEIPT', 'INVOICE_QUALIFIED'],
    debit_entries: [
      { account: '会議費', account_on_document: true, sub_account: null, amount: 1200, amount_on_document: true, tax_category_id: '課税仕入 10%' }
    ],
    credit_entries: [
      { account: '現金', account_on_document: true, sub_account: null, amount: 1200, amount_on_document: true, tax_category_id: '対象外' }
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

  // 行9: 業務委託料、ルール適用済み、適格請求書
  {
    id: 'jrn-00000009',
    display_order: 9,
    transaction_date: '2025-01-27', date_on_document: true,
    description: '業務委託料',
    document_id: 'receipt-001',
    status: 'exported',  // 出力済み
    is_read: true,
    deleted_at: null,
    labels: ['INVOICE', 'INVOICE_QUALIFIED'],
    debit_entries: [
      { account: '外注費', account_on_document: true, sub_account: null, amount: 150000, amount_on_document: true, tax_category_id: '課税仕入 10%' }
    ],
    credit_entries: [
      { account: '普通預金', account_on_document: true, sub_account: '三菱UFJ', amount: 150000, amount_on_document: true, tax_category_id: '対象外' }
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

  // 行10: JR神戸線、ルール適用済み、適格請求書
  {
    id: 'jrn-00000010',
    display_order: 10,
    transaction_date: '2025-01-28', date_on_document: true,
    description: 'JR神戸線',
    document_id: 'receipt-001',
    status: 'exported',  // 出力済み
    is_read: true,
    deleted_at: null,
    labels: ['TRANSPORT', 'RULE_APPLIED', 'INVOICE_QUALIFIED', 'NEED_DOCUMENT', 'NEED_INFO'],  // 複数フラグ
    debit_entries: [
      { account: '旅費交通費', account_on_document: true, sub_account: null, amount: 320, amount_on_document: true, tax_category_id: '課税仕入 10%' }
    ],
    credit_entries: [
      { account: '現金', account_on_document: true, sub_account: null, amount: 320, amount_on_document: true, tax_category_id: '対象外' }
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
      NEED_DOCUMENT: { enabled: true, text: '交通費の領収書をお送りください', chatworkUrl: 'https://www.chatwork.com/#!rid00010' },
      NEED_INFO: { enabled: true, text: '行き先を教えてください', chatworkUrl: '' }
    },
    staff_notes_author: '山田太郎',
    is_credit_card_payment: false
  },

  // 行11: オフィス産科、ルール適用済み、適格請求書
  {
    id: 'jrn-00000011',
    display_order: 11,
    transaction_date: '2025-01-29', date_on_document: true,
    description: 'オフィス産科',
    document_id: 'receipt-001',
    status: 'exported',  // 出力済み
    is_read: true,
    deleted_at: null,
    labels: ['RECEIPT', 'INVOICE_QUALIFIED'],
    debit_entries: [
      { account: '地代家賃', account_on_document: true, sub_account: 'ガリツリ', amount: 6000, amount_on_document: true, tax_category_id: 'クレジットカード' }
    ],
    credit_entries: [
      { account: '未払金', account_on_document: true, sub_account: null, amount: 6000, amount_on_document: true, tax_category_id: '対象外' }
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

  // 行12: 消耗品費（ボ・一儿ペン）、ルール適用可能、適格請求書
  {
    id: 'jrn-00000012',
    display_order: 12,
    transaction_date: '2025-01-30', date_on_document: true,
    description: '消耗品費（ボールペン）',
    document_id: 'receipt-001',
    status: 'exported',  // 出力済み
    is_read: true,
    deleted_at: null,
    labels: ['RECEIPT', 'RULE_AVAILABLE', 'INVOICE_QUALIFIED'],
    debit_entries: [
      { account: '消耗品費', account_on_document: true, sub_account: null, amount: 800, amount_on_document: true, tax_category_id: '課税仕入 10%' }
    ],
    credit_entries: [
      { account: '現金', account_on_document: true, sub_account: null, amount: 800, amount_on_document: true, tax_category_id: '対象外' }
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

  // 行13: タクシー代（不適格運送）、ルール適用済み、不適格請求書
  {
    id: 'jrn-00000013',
    display_order: 13,
    transaction_date: '2025-01-31', date_on_document: true,
    description: 'タクシー代（不適格運送）',
    document_id: 'receipt-001',
    status: 'exported',  // 出力済み
    is_read: true,
    deleted_at: null,
    labels: ['TRANSPORT', 'RULE_APPLIED', 'INVOICE_NOT_QUALIFIED'],
    debit_entries: [
      { account: '旅費交通費', account_on_document: true, sub_account: null, amount: 750, amount_on_document: true, tax_category_id: '課税仕入 10%' }
    ],
    credit_entries: [
      { account: '現金', account_on_document: true, sub_account: null, amount: 750, amount_on_document: true, tax_category_id: '対象外' }
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

  // 行14: NTTドコモ、適格請求書
  {
    id: 'jrn-00000014',
    display_order: 14,
    transaction_date: '2025-02-01', date_on_document: true,
    description: 'NTTドコモ',
    document_id: 'receipt-001',
    status: 'exported',  // 出力済み
    is_read: true,
    deleted_at: null,
    labels: ['INVOICE', 'INVOICE_QUALIFIED'],
    debit_entries: [
      { account: '通信費', account_on_document: true, sub_account: null, amount: 8000, amount_on_document: true, tax_category_id: '課税仕入 10%' }
    ],
    credit_entries: [
      { account: '普通預金', account_on_document: true, sub_account: '三菱UFJ', amount: 8000, amount_on_document: true, tax_category_id: '対象外' }
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

  // 行15: 手数料通帳費、適格請求書、複数税率
  {
    id: 'jrn-00000015',
    display_order: 15,
    transaction_date: '2025-02-01', date_on_document: true,
    description: '手数料通帳費',
    document_id: 'receipt-001',
    status: 'exported',  // 出力済み
    is_read: true,
    deleted_at: null,
    labels: ['RECEIPT', 'INVOICE_QUALIFIED', 'MULTI_TAX_RATE', 'EXPORT_EXCLUDE'],  // 出力対象外
    debit_entries: [
      { account: '消耗品費', account_on_document: true, sub_account: null, amount: 0, amount_on_document: true, tax_category_id: '課税仕入 10%' }
    ],
    credit_entries: [
      { account: '現金', account_on_document: true, sub_account: null, amount: 0, amount_on_document: true, tax_category_id: '対象外' }
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

  // 行16: 神戸皇居鎌タクシー、ルール適用済み、適格請求書
  {
    id: 'jrn-00000016',
    display_order: 16,
    transaction_date: '2025-02-02', date_on_document: true,
    description: '神戸皇居鎌タクシー',
    document_id: 'receipt-001',
    status: 'exported',  // 出力済み
    is_read: true,
    deleted_at: null,
    labels: ['TRANSPORT', 'RULE_APPLIED', 'INVOICE_QUALIFIED'],
    debit_entries: [
      { account: '旅費交通費', account_on_document: true, sub_account: null, amount: 800, amount_on_document: true, tax_category_id: '課税仕入 10%' }
    ],
    credit_entries: [
      { account: '現金', account_on_document: true, sub_account: null, amount: 800, amount_on_document: true, tax_category_id: '対象外' }
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

  // 行17: 買取に宗鹿釜交友貴、適格請求書
  {
    id: 'jrn-00000017',
    display_order: 17,
    transaction_date: '2025-02-02', date_on_document: true,
    description: '貴金に宗鹿釜交友貴',
    document_id: 'receipt-001',
    status: 'exported',  // 出力済み
    is_read: true,
    deleted_at: null,
    labels: ['RECEIPT', 'INVOICE_QUALIFIED'],
    debit_entries: [
      { account: '消耗品費', account_on_document: true, sub_account: null, amount: 500000, amount_on_document: true, tax_category_id: '課税仕入 10%' }
    ],
    credit_entries: [
      { account: '普通預金', account_on_document: true, sub_account: '三菱UFJ', amount: 500000, amount_on_document: true, tax_category_id: '対象外' }
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

  // 行18: 不可分抜き回、適格請求書
  {
    id: 'jrn-00000018',
    display_order: 18,
    transaction_date: '2025-02-02', date_on_document: true,
    description: '不可分抜き回',
    document_id: 'receipt-001',
    status: 'exported',  // 出力済み
    is_read: true,
    deleted_at: null,
    labels: ['RECEIPT', 'INVOICE_QUALIFIED'],
    debit_entries: [
      { account: '飲出羽', account_on_document: true, sub_account: null, amount: 20000, amount_on_document: true, tax_category_id: '課税仕入 10%' }
    ],
    credit_entries: [
      { account: '現金', account_on_document: true, sub_account: null, amount: 20000, amount_on_document: true, tax_category_id: '対象外' }
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

  // 行19: 事例寿判上いは詮, 適格請求書
  {
    id: 'jrn-00000019',
    display_order: 19,
    transaction_date: '2025-02-03', date_on_document: true,
    description: '事例寿判上いは詮',
    document_id: 'receipt-001',
    status: 'exported',  // 出力済み
    is_read: true,
    deleted_at: null,
    labels: ['RECEIPT', 'INVOICE_QUALIFIED'],
    debit_entries: [
      { account: '消耗品費', account_on_document: true, sub_account: '現金', amount: 50000, amount_on_document: true, tax_category_id: '課税仕入 10%' }
    ],
    credit_entries: [
      { account: '普通預金', account_on_document: true, sub_account: '三菱UFJ', amount: 50000, amount_on_document: true, tax_category_id: '対象外' }
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

  // 行20: 広告宣伝費（銀行振込）、適格請求書
  {
    id: 'jrn-00000020',
    display_order: 20,
    transaction_date: '2025-02-04', date_on_document: true,
    description: '広告宣伝費（銀行振込）',
    document_id: 'receipt-001',
    status: 'exported',  // 出力済み
    is_read: true,
    deleted_at: null,
    labels: ['BANK_STATEMENT', 'INVOICE_QUALIFIED', 'NEED_CONSULT', 'NEED_DOCUMENT'],  // 複数フラグ2
    debit_entries: [
      { account: '広告宣伝費', account_on_document: true, sub_account: '銀行', amount: 100000, amount_on_document: true, tax_category_id: '課税仕入 10%' }
    ],
    credit_entries: [
      { account: '普通預金', account_on_document: true, sub_account: '三菱UFJ', amount: 100000, amount_on_document: true, tax_category_id: '対象外' }
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
      NEED_CONSULT: { enabled: true, text: '広告宣伝費の計上について相談したい', chatworkUrl: 'https://www.chatwork.com/#!rid00020' },
      NEED_DOCUMENT: { enabled: true, text: '契約書のコピーをお送りください', chatworkUrl: '' }
    },
    staff_notes_author: '佐藤花子',
    is_credit_card_payment: false
  },

  // 行21: 業務委託料、適格請求書（出力済み）
  {
    id: 'jrn-00000021',
    display_order: 21,
    transaction_date: '2025-02-05', date_on_document: true,
    description: '業務委託料',
    document_id: 'receipt-001',
    status: 'exported',
    is_read: true,
    deleted_at: null,
    labels: ['RECEIPT', 'INVOICE_QUALIFIED'],
    debit_entries: [
      { account: '外注費', account_on_document: true, sub_account: null, amount: 8000, amount_on_document: true, tax_category_id: '課税仕入 10%' }
    ],
    credit_entries: [
      { account: '普通預金', account_on_document: true, sub_account: '三菱UFJ', amount: 8000, amount_on_document: true, tax_category_id: '対象外' }
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
  // 行22-30: イエロー（未読、事故フラグ、サポート依頼）
  // ============================================================

  // 行22: OCR信頼度低、未読
  {
    id: 'jrn-00000022',
    display_order: 22,
    transaction_date: '2025-02-06', date_on_document: true,
    description: '資料作成料',
    document_id: 'receipt-001',
    status: null,
    is_read: true,  // 既読
    deleted_at: '2026-02-21T00:00:00Z',  // ゴミ箱（検証用）
    labels: ['RECEIPT', 'UNREADABLE_ESTIMATED'],
    debit_entries: [
      { account: '消耗品費', account_on_document: true, sub_account: null, amount: 10000, amount_on_document: true, tax_category_id: '課税仕入 10%' }
    ],
    credit_entries: [
      { account: '現金', account_on_document: true, sub_account: null, amount: 10000, amount_on_document: true, tax_category_id: '対象外' }
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

  // 行23: 重複疑い、未読
  {
    id: 'jrn-00000023',
    display_order: 23,
    transaction_date: '2025-02-07', date_on_document: true,
    description: '不明な振り',
    document_id: 'receipt-001',
    status: null,
    is_read: true,  // 既読
    deleted_at: '2026-02-21T00:00:00Z',  // ゴミ箱（検証用）
    labels: ['TRANSPORT', 'DUPLICATE_SUSPECT', 'DUPLICATE_CONFIRMED'],
    debit_entries: [
      { account: '旅費交通費', account_on_document: true, sub_account: null, amount: 9000, amount_on_document: true, tax_category_id: '課税仕入 10%' }
    ],
    credit_entries: [
      { account: '現金', account_on_document: true, sub_account: null, amount: 9000, amount_on_document: true, tax_category_id: '対象外' }
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

  // 行24: 日付異常、未読
  {
    id: 'jrn-00000024',
    display_order: 24,
    transaction_date: '2026-12-31', date_on_document: true,
    description: '未来日付の仕訳',
    document_id: 'receipt-001',
    status: null,
    is_read: false,
    deleted_at: null,
    labels: ['RECEIPT', 'DATE_OUT_OF_RANGE'],
    debit_entries: [
      { account: '消耗品費', account_on_document: true, sub_account: null, amount: 11000, amount_on_document: true, tax_category_id: '課税仕入 10%' }
    ],
    credit_entries: [
      { account: '現金', account_on_document: true, sub_account: null, amount: 11000, amount_on_document: true, tax_category_id: '対象外' }
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

  // 行25: 金額null（on_document=true: 項目はあるが読めなかった）、複数証票あり、未読
  {
    id: 'jrn-00000025',
    display_order: 25,
    transaction_date: '2025-02-08', date_on_document: true,
    description: '異常金額',
    document_id: 'receipt-001',
    status: null,
    is_read: false,
    deleted_at: null,
    labels: ['RECEIPT', 'AMOUNT_UNCLEAR', 'MULTIPLE_VOUCHERS'],
    debit_entries: [
      { account: '消耗品費', account_on_document: true, sub_account: null, amount: null, amount_on_document: true, tax_category_id: '課税仕入 10%' }
    ],
    credit_entries: [
      { account: '現金', account_on_document: true, sub_account: null, amount: null, amount_on_document: true, tax_category_id: '対象外' }
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

  // 行26: サポート依頼（help）、メモあり、未読
  {
    id: 'jrn-00000026',
    display_order: 26,
    transaction_date: '2025-02-05', date_on_document: true,
    description: '資料持ち',
    document_id: 'receipt-001',
    status: null,
    is_read: false,
    deleted_at: null,
    labels: ['RECEIPT', 'MEMO_DETECTED', 'NEED_CONSULT'],  // 旧help → 相談が必要
    debit_entries: [
      { account: '消耗品費', account_on_document: true, sub_account: null, amount: 8000, amount_on_document: true, tax_category_id: '課税仕入 10%' }
    ],
    credit_entries: [
      { account: '現金', account_on_document: true, sub_account: null, amount: 8000, amount_on_document: true, tax_category_id: '対象外' }
    ],
    rule_id: null,
    rule_confidence: null,
    invoice_status: null,
    invoice_number: null,
    memo: 'この仕訳が何かわかりません。助けてください。',
    memo_author: '山田太郎',
    memo_target: '佐藤花子',
    memo_created_at: '2025-02-08T10:00:00Z',
    staff_notes: {
      ...createEmptyStaffNotes(),
      NEED_CONSULT: { enabled: true, text: '勘定科目が不明です', chatworkUrl: '' }
    },
    staff_notes_author: '山田太郎',
    is_credit_card_payment: false
  },

  // 行27: 相談（soudan）、メモあり、未読
  {
    id: 'jrn-00000027',
    display_order: 27,
    transaction_date: '2025-02-07', date_on_document: true,
    description: '材料費・調整等',
    document_id: 'receipt-001',
    status: null,
    is_read: false,
    deleted_at: null,
    labels: ['INVOICE', 'MEMO_DETECTED', 'NEED_CONSULT'],  // 旧soudan → 相談が必要
    debit_entries: [
      { account: '消耗品費', account_on_document: true, sub_account: null, amount: 11000, amount_on_document: true, tax_category_id: '課税仕入 10%' }
    ],
    credit_entries: [
      { account: '現金', account_on_document: true, sub_account: null, amount: 11000, amount_on_document: true, tax_category_id: '対象外' }
    ],
    rule_id: null,
    rule_confidence: null,
    invoice_status: null,
    invoice_number: null,
    memo: 'この金額で合っていますか？確認してください。',
    memo_author: '鈴木一郎',
    memo_target: '田中次郎',
    memo_created_at: '2025-02-08T14:00:00Z',
    staff_notes: {
      ...createEmptyStaffNotes(),
      NEED_CONSULT: { enabled: true, text: '金額の確認をお願いします', chatworkUrl: 'https://www.chatwork.com/#!rid00027' },
      REMINDER: { enabled: true, text: '来月再確認', chatworkUrl: '' }
    },
    staff_notes_author: '鈴木一郎',
    is_credit_card_payment: false
  },

  // 行28: 日付null（on_document=true: 日付欄はあるが読めなかった）、メモあり、未読
  {
    id: 'jrn-00000028',
    display_order: 28,
    transaction_date: null, date_on_document: true,
    description: '現金領収遅れせれ仮払い',
    document_id: 'receipt-001',
    status: null,
    is_read: false,
    deleted_at: null,
    labels: ['RECEIPT', 'DATE_UNKNOWN', 'MEMO_DETECTED', 'NEED_DOCUMENT'],  // 日付不明 + 手書きメモ + 資料が必要
    debit_entries: [
      { account: '旅費交通費', account_on_document: true, sub_account: null, amount: 5000, amount_on_document: true, tax_category_id: '課税仕入 10%' }
    ],
    credit_entries: [
      { account: '現金', account_on_document: true, sub_account: null, amount: 5000, amount_on_document: true, tax_category_id: '対象外' }
    ],
    rule_id: null,
    rule_confidence: null,
    invoice_status: null,
    invoice_number: null,
    memo: '領収書が見つかりませんでした。再発行を依頼中です。',
    memo_author: '高橋美咲',
    memo_target: '伊藤健太',
    memo_created_at: '2025-02-08T15:00:00Z',
    staff_notes: {
      ...createEmptyStaffNotes(),
      NEED_DOCUMENT: { enabled: true, text: '領収書の再発行を依頼中です', chatworkUrl: 'https://www.chatwork.com/#!rid00028' }
    },
    staff_notes_author: '高橋美咲',
    is_credit_card_payment: false
  },

  // 行29: 貸借不一致、未読
  {
    id: 'jrn-00000029',
    display_order: 29,
    transaction_date: '2025-02-09', date_on_document: true,
    description: '入力ミス例',
    document_id: 'receipt-001',
    status: null,
    is_read: false,
    deleted_at: null,
    labels: ['RECEIPT', 'DEBIT_CREDIT_MISMATCH'],
    debit_entries: [
      { account: '消耗品費', account_on_document: true, sub_account: null, amount: 5000, amount_on_document: true, tax_category_id: '課税仕入 10%' }
    ],
    credit_entries: [
      { account: '現金', account_on_document: true, sub_account: null, amount: 4999, amount_on_document: true, tax_category_id: '対象外' }
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

  // 行30: 勘定科目null（on_document=false: 証憑に勘定科目の記載なし）、貸借不一致、未読
  {
    id: 'jrn-00000030',
    display_order: 30,
    transaction_date: '2025-02-10', date_on_document: true,
    description: '計算誤差例',
    document_id: 'receipt-001',
    status: null,
    is_read: false,
    deleted_at: null,
    labels: ['INVOICE', 'ACCOUNT_UNKNOWN', 'DEBIT_CREDIT_MISMATCH'],
    debit_entries: [
      { account: null, account_on_document: false, sub_account: null, amount: 10000, amount_on_document: true, tax_category_id: '課税仕入 10%' }
    ],
    credit_entries: [
      { account: null, account_on_document: false, sub_account: null, amount: 10001, amount_on_document: true, tax_category_id: '対象外' }
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
  // 行31-35: 複合仕訳テストデータ（rowspan検証用）
  // ============================================================

  // 行31: 1対2複合仕訳（経費精算 → 現金+クレジットカード）
  {
    id: 'jrn-00000031',
    display_order: 31,
    transaction_date: '2025-02-11', date_on_document: true,
    description: 'タクシー代（経費精算）',
    document_id: 'receipt-001',
    status: null,
    is_read: true,
    deleted_at: null,
    labels: ['TRANSPORT', 'RULE_APPLIED', 'INVOICE_QUALIFIED'],
    debit_entries: [
      { account: '旅費交通費', account_on_document: true, sub_account: null, amount: 5000, amount_on_document: true, tax_category_id: '課税仕入 10%' }
    ],
    credit_entries: [
      { account: '現金', account_on_document: true, sub_account: null, amount: 3000, amount_on_document: true, tax_category_id: '対象外' },
      { account: '未払金', account_on_document: true, sub_account: 'クレジットカード', amount: 2000, amount_on_document: true, tax_category_id: '対象外' }
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

  // 行32: 2対1複合仕訳（交通費+宿泊費 → クレジットカード）
  {
    id: 'jrn-00000032',
    display_order: 32,
    transaction_date: '2025-02-12', date_on_document: true,
    description: '出張費用（交通費+宿泊費）',
    document_id: 'receipt-001',
    status: null,
    is_read: true,
    deleted_at: null,
    labels: ['CREDIT_CARD', 'INVOICE_QUALIFIED'],
    debit_entries: [
      { account: '旅費交通費', account_on_document: true, sub_account: '交通費', amount: 8000, amount_on_document: true, tax_category_id: '課税仕入 10%' },
      { account: '旅費交通費', account_on_document: true, sub_account: '宿泊費', amount: 12000, amount_on_document: true, tax_category_id: '課税仕入 10%' }
    ],
    credit_entries: [
      { account: '未払金', account_on_document: true, sub_account: 'クレジットカード', amount: 20000, amount_on_document: true, tax_category_id: '対象外' }
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

  // 行33: 1対3複合仕訳（給与 → 現金+社会保険料+源泉徴収税）
  {
    id: 'jrn-00000033',
    display_order: 33,
    transaction_date: '2025-02-13', date_on_document: true,
    description: '給与支払（山田太郎）',
    document_id: 'receipt-001',
    status: null,
    is_read: true,
    deleted_at: null,
    labels: ['BANK_STATEMENT', 'INVOICE_QUALIFIED'],
    debit_entries: [
      { account: '給料手当', account_on_document: true, sub_account: null, amount: 300000, amount_on_document: true, tax_category_id: '対象外' }
    ],
    credit_entries: [
      { account: '普通預金', account_on_document: true, sub_account: '三菱UFJ', amount: 250000, amount_on_document: true, tax_category_id: '対象外' },
      { account: '預り金', account_on_document: true, sub_account: '社会保険料', amount: 30000, amount_on_document: true, tax_category_id: '対象外' },
      { account: '預り金', account_on_document: true, sub_account: '源泉徴収税', amount: 20000, amount_on_document: true, tax_category_id: '対象外' }
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

  // 行34: 1対10複合仕訳（経費精算 → 10項目の内訳）
  {
    id: 'jrn-00000034',
    display_order: 34,
    transaction_date: '2025-02-14', date_on_document: true,
    description: '経費精算（明細10項目）',
    document_id: 'receipt-001',
    status: null,
    is_read: true,
    deleted_at: null,
    labels: ['RECEIPT', 'INVOICE_QUALIFIED'],
    debit_entries: [
      { account: '経費精算', account_on_document: true, sub_account: null, amount: 55000, amount_on_document: true, tax_category_id: '課税仕入 10%' }
    ],
    credit_entries: [
      { account: '現金', account_on_document: true, sub_account: '項目1', amount: 5000, amount_on_document: true, tax_category_id: '対象外' },
      { account: '現金', account_on_document: true, sub_account: '項目2', amount: 5000, amount_on_document: true, tax_category_id: '対象外' },
      { account: '現金', account_on_document: true, sub_account: '項目3', amount: 5000, amount_on_document: true, tax_category_id: '対象外' },
      { account: '現金', account_on_document: true, sub_account: '項目4', amount: 5000, amount_on_document: true, tax_category_id: '対象外' },
      { account: '現金', account_on_document: true, sub_account: '項目5', amount: 5000, amount_on_document: true, tax_category_id: '対象外' },
      { account: '現金', account_on_document: true, sub_account: '項目6', amount: 5000, amount_on_document: true, tax_category_id: '対象外' },
      { account: '現金', account_on_document: true, sub_account: '項目7', amount: 5000, amount_on_document: true, tax_category_id: '対象外' },
      { account: '現金', account_on_document: true, sub_account: '項目8', amount: 5000, amount_on_document: true, tax_category_id: '対象外' },
      { account: '現金', account_on_document: true, sub_account: '項目9', amount: 5000, amount_on_document: true, tax_category_id: '対象外' },
      { account: '現金', account_on_document: true, sub_account: '項目10', amount: 5000, amount_on_document: true, tax_category_id: '対象外' }
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

  // 行35: 3対3複合仕訳（N対N、決算仕訳）
  {
    id: 'jrn-00000035',
    display_order: 35,
    transaction_date: '2025-02-15', date_on_document: true,
    description: '決算仕訳（費用振替）',
    document_id: 'receipt-001',
    status: null,
    is_read: true,
    deleted_at: null,
    labels: ['INVOICE', 'INVOICE_QUALIFIED'],
    debit_entries: [
      { account: '売上原価', account_on_document: true, sub_account: '材料費', amount: 100000, amount_on_document: true, tax_category_id: '課税仕入 10%' },
      { account: '売上原価', account_on_document: true, sub_account: '労務費', amount: 150000, amount_on_document: true, tax_category_id: '対象外' },
      { account: '売上原価', account_on_document: true, sub_account: '経費', amount: 50000, amount_on_document: true, tax_category_id: '課税仕入 10%' }
    ],
    credit_entries: [
      { account: '仕掛品', account_on_document: true, sub_account: '材料費', amount: 100000, amount_on_document: true, tax_category_id: '対象外' },
      { account: '仕掛品', account_on_document: true, sub_account: '労務費', amount: 150000, amount_on_document: true, tax_category_id: '対象外' },
      { account: '仕掛品', account_on_document: true, sub_account: '経費', amount: 50000, amount_on_document: true, tax_category_id: '対象外' }
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
