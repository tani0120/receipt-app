/**
 * Phase 5 テストフィクスチャ（30件 + 複合仕訳5件 = 35件。件数は今後増減する）
 *
 * 目的: UIモック検証、フロントエンド実装、バックエンド実装で使用
 * 参照: phase5_level3_test_fixture_30cases_260214.md.resolved
 * 更新: 2026-02-15 - status値をexportedのみに変更、要対応ラベル追加
 */

import type { JournalPhase5Mock } from '../types/journal_phase5_mock.type';

export const mockJournalsPhase5: JournalPhase5Mock[] = [
  // ============================================================
  // 行1-10: グリーン（正常、バリエーション豊富）
  // ============================================================

  // 行1: 交通費（タクシー）、ルール適用済み、適格請求書
  {
    id: 'j001',
    display_order: 1,
    transaction_date: '2024-07-29',
    description: '神戸相互タクシー',
    receipt_id: 'receipt-001',
    status: 'exported',  // 出力済み
    is_read: true,
    deleted_at: null,
    labels: ['TRANSPORT', 'RULE_APPLIED', 'INVOICE_QUALIFIED'],
    debit_entries: [
      { account: '旅費交通費', sub_account: null, amount: 800, tax_category: '課税仕入込10%' }
    ],
    credit_entries: [
      { account: '現金', sub_account: null, amount: 800, tax_category: '対象外' }
    ],
    rule_id: 'r001',
    rule_confidence: 0.95,
    invoice_status: 'qualified',
    invoice_number: 'T1234567890123',
    memo: null,
    memo_author: null,
    memo_target: null,
    memo_created_at: null
  },

  // 行2: レシート、ルール適用可能、不適格請求書
  {
    id: 'j002',
    display_order: 2,
    transaction_date: '2025-01-20',
    description: 'VIVACE BEAUTYクリニック',
    receipt_id: 'receipt-001',
    status: 'exported',  // 出力済み
    is_read: false,  // 未読（黄色背景）
    deleted_at: null,
    labels: ['RECEIPT', 'RULE_AVAILABLE', 'INVOICE_NOT_QUALIFIED', 'NEED_DOCUMENT'],  // 資料が必要
    debit_entries: [
      { account: 'メンテナンス費', sub_account: null, amount: 11000, tax_category: '課税仕入込10%' }
    ],
    credit_entries: [
      { account: '現金', sub_account: null, amount: 11000, tax_category: '対象外' }
    ],
    rule_id: null,
    rule_confidence: null,
    invoice_status: 'not_qualified',
    invoice_number: null,
    memo: null,
    memo_author: null,
    memo_target: null,
    memo_created_at: null
  },

  // 行3: レシート、ルール適用済み、適格請求書
  {
    id: 'j003',
    display_order: 3,
    transaction_date: '2025-01-21',
    description: 'コピー用紙',
    receipt_id: 'receipt-001',
    status: 'exported',  // 出力済み
    is_read: false,  // 未読（黄色背景）
    deleted_at: null,
    labels: ['RECEIPT', 'INVOICE_QUALIFIED', 'NEED_CONFIRM'],  // 確認が必要
    debit_entries: [
      { account: '消耗品費', sub_account: null, amount: 2500, tax_category: '課税仕入込10%' }
    ],
    credit_entries: [
      { account: '現金', sub_account: null, amount: 2500, tax_category: '対象外' }
    ],
    rule_id: null,
    rule_confidence: null,
    invoice_status: 'qualified',
    invoice_number: 'T9876543210987',
    memo: null,
    memo_author: null,
    memo_target: null,
    memo_created_at: null
  },

  // 行4: 文房具セット、ルール適用済み、適格請求書
  {
    id: 'j004',
    display_order: 4,
    transaction_date: '2025-01-22',
    description: '文房具セット',
    receipt_id: 'receipt-001',
    status: 'exported',  // 出力済み
    is_read: true,
    deleted_at: null,
    labels: ['CREDIT_CARD', 'INVOICE_QUALIFIED'],
    debit_entries: [
      { account: '消耗品費', sub_account: null, amount: 3200, tax_category: '課税仕入込10%' }
    ],
    credit_entries: [
      { account: '未払金', sub_account: null, amount: 3200, tax_category: '対象外' }
    ],
    rule_id: null,
    rule_confidence: null,
    invoice_status: 'qualified',
    invoice_number: 'T1111111111111',
    memo: null,
    memo_author: null,
    memo_target: null,
    memo_created_at: null
  },

  // 行5: タクシー代（不適格運送）、ルール適用済み、適格請求書
  {
    id: 'j005',
    display_order: 5,
    transaction_date: '2025-01-23',
    description: 'タクシー代（不適格運送）',
    receipt_id: 'receipt-001',
    status: 'exported',  // 出力済み
    is_read: true,
    deleted_at: null,
    labels: ['BANK_STATEMENT', 'RULE_APPLIED', 'INVOICE_QUALIFIED', 'NEED_CONSULT'],  // 相談が必要
    debit_entries: [
      { account: '旅費交通費', sub_account: null, amount: 650, tax_category: '課税仕入込10%' }
    ],
    credit_entries: [
      { account: '普通預金', sub_account: '三菱UFJ', amount: 650, tax_category: '対象外' }
    ],
    rule_id: 'r003',
    rule_confidence: 0.88,
    invoice_status: 'qualified',
    invoice_number: 'T2222222222222',
    memo: null,
    memo_author: null,
    memo_target: null,
    memo_created_at: null
  },

  // 行6: タクシー代、ルール適用済み、適格請求書
  {
    id: 'j006',
    display_order: 6,
    transaction_date: '2025-01-24',
    description: 'タクシー代',
    receipt_id: 'receipt-001',
    status: 'exported',  // 出力済み
    is_read: true,
    deleted_at: null,
    labels: ['TRANSPORT', 'RULE_APPLIED', 'INVOICE_QUALIFIED'],
    debit_entries: [
      { account: '旅費交通費', sub_account: null, amount: 1500, tax_category: '課税仕入込10%' }
    ],
    credit_entries: [
      { account: '現金', sub_account: null, amount: 1500, tax_category: '対象外' }
    ],
    rule_id: 'r004',
    rule_confidence: 0.92,
    invoice_status: 'qualified',
    invoice_number: 'T3333333333333',
    memo: null,
    memo_author: null,
    memo_target: null,
    memo_created_at: null
  },

  // 行7: 電気代（関西電力）、ルール適用済み、適格請求書Note: 適格請求書が発行されたため、適格請求書
  {
    id: 'j007',
    display_order: 7,
    transaction_date: '2025-01-25',
    description: '電気代 関西電力',
    receipt_id: 'receipt-001',
    status: 'exported',  // 出力済み
    is_read: true,
    deleted_at: null,
    labels: ['INVOICE', 'RULE_APPLIED', 'INVOICE_QUALIFIED'],
    debit_entries: [
      { account: '水道光熱費', sub_account: '電気代', amount: 12000, tax_category: '課税仕入込10%' }
    ],
    credit_entries: [
      { account: '普通預金', sub_account: '三菱UFJ', amount: 12000, tax_category: '対象外' }
    ],
    rule_id: 'r005',
    rule_confidence: 0.97,
    invoice_status: 'qualified',
    invoice_number: 'T4444444444444',
    memo: null,
    memo_author: null,
    memo_target: null,
    memo_created_at: null
  },

  // 行8: スターバックス、ルール適用済み、適格請求書
  {
    id: 'j008',
    display_order: 8,
    transaction_date: '2025-01-26',
    description: 'スターバックス',
    receipt_id: 'receipt-001',
    status: 'exported',  // 出力済み
    is_read: true,
    deleted_at: null,
    labels: ['RECEIPT', 'INVOICE_QUALIFIED'],
    debit_entries: [
      { account: '会議費', sub_account: null, amount: 1200, tax_category: '課税仕入込10%' }
    ],
    credit_entries: [
      { account: '現金', sub_account: null, amount: 1200, tax_category: '対象外' }
    ],
    rule_id: null,
    rule_confidence: null,
    invoice_status: 'qualified',
    invoice_number: 'T5555555555555',
    memo: null,
    memo_author: null,
    memo_target: null,
    memo_created_at: null
  },

  // 行9: 業務委託料、ルール適用済み、適格請求書
  {
    id: 'j009',
    display_order: 9,
    transaction_date: '2025-01-27',
    description: '業務委託料',
    receipt_id: 'receipt-001',
    status: 'exported',  // 出力済み
    is_read: true,
    deleted_at: null,
    labels: ['INVOICE', 'INVOICE_QUALIFIED'],
    debit_entries: [
      { account: '外注費', sub_account: null, amount: 150000, tax_category: '課税仕入込10%' }
    ],
    credit_entries: [
      { account: '普通預金', sub_account: '三菱UFJ', amount: 150000, tax_category: '対象外' }
    ],
    rule_id: null,
    rule_confidence: null,
    invoice_status: 'qualified',
    invoice_number: 'T6666666666666',
    memo: null,
    memo_author: null,
    memo_target: null,
    memo_created_at: null
  },

  // 行10: JR神戸線、ルール適用済み、適格請求書
  {
    id: 'j010',
    display_order: 10,
    transaction_date: '2025-01-28',
    description: 'JR神戸線',
    receipt_id: 'receipt-001',
    status: 'exported',  // 出力済み
    is_read: true,
    deleted_at: null,
    labels: ['TRANSPORT', 'RULE_APPLIED', 'INVOICE_QUALIFIED', 'NEED_DOCUMENT', 'NEED_CONFIRM'],  // 複数フラグ
    debit_entries: [
      { account: '旅費交通費', sub_account: null, amount: 320, tax_category: '課税仕入込10%' }
    ],
    credit_entries: [
      { account: '現金', sub_account: null, amount: 320, tax_category: '対象外' }
    ],
    rule_id: 'r008',
    rule_confidence: 0.93,
    invoice_status: 'qualified',
    invoice_number: 'T7777777777777',
    memo: null,
    memo_author: null,
    memo_target: null,
    memo_created_at: null
  },

  // 行11: オフィス産科、ルール適用済み、適格請求書
  {
    id: 'j011',
    display_order: 11,
    transaction_date: '2025-01-29',
    description: 'オフィス産科',
    receipt_id: 'receipt-001',
    status: 'exported',  // 出力済み
    is_read: true,
    deleted_at: null,
    labels: ['RECEIPT', 'INVOICE_QUALIFIED'],
    debit_entries: [
      { account: '地代家賃', sub_account: 'ガリツリ', amount: 6000, tax_category: 'クレジットカード' }
    ],
    credit_entries: [
      { account: '未払金', sub_account: null, amount: 6000, tax_category: '対象外' }
    ],
    rule_id: null,
    rule_confidence: null,
    invoice_status: 'qualified',
    invoice_number: 'T8888888888888',
    memo: null,
    memo_author: null,
    memo_target: null,
    memo_created_at: null
  },

  // 行12: 消耗品費（ボ・一儿ペン）、ルール適用可能、適格請求書
  {
    id: 'j012',
    display_order: 12,
    transaction_date: '2025-01-30',
    description: '消耗品費（ボールペン）',
    receipt_id: 'receipt-001',
    status: 'exported',  // 出力済み
    is_read: true,
    deleted_at: null,
    labels: ['RECEIPT', 'RULE_AVAILABLE', 'INVOICE_QUALIFIED'],
    debit_entries: [
      { account: '消耗品費', sub_account: null, amount: 800, tax_category: '課税仕入込10%' }
    ],
    credit_entries: [
      { account: '現金', sub_account: null, amount: 800, tax_category: '対象外' }
    ],
    rule_id: null,
    rule_confidence: null,
    invoice_status: 'qualified',
    invoice_number: 'T9999999999999',
    memo: null,
    memo_author: null,
    memo_target: null,
    memo_created_at: null
  },

  // 行13: タクシー代（不適格運送）、ルール適用済み、不適格請求書
  {
    id: 'j013',
    display_order: 13,
    transaction_date: '2025-01-31',
    description: 'タクシー代（不適格運送）',
    receipt_id: 'receipt-001',
    status: 'exported',  // 出力済み
    is_read: true,
    deleted_at: null,
    labels: ['TRANSPORT', 'RULE_APPLIED', 'INVOICE_NOT_QUALIFIED'],
    debit_entries: [
      { account: '旅費交通費', sub_account: null, amount: 750, tax_category: '課税仕入込10%' }
    ],
    credit_entries: [
      { account: '現金', sub_account: null, amount: 750, tax_category: '対象外' }
    ],
    rule_id: 'r011',
    rule_confidence: 0.85,
    invoice_status: 'not_qualified',
    invoice_number: null,
    memo: null,
    memo_author: null,
    memo_target: null,
    memo_created_at: null
  },

  // 行14: NTTドコモ、適格請求書
  {
    id: 'j014',
    display_order: 14,
    transaction_date: '2025-02-01',
    description: 'NTTドコモ',
    receipt_id: 'receipt-001',
    status: 'exported',  // 出力済み
    is_read: true,
    deleted_at: null,
    labels: ['INVOICE', 'INVOICE_QUALIFIED'],
    debit_entries: [
      { account: '通信費', sub_account: null, amount: 8000, tax_category: '課税仕入込10%' }
    ],
    credit_entries: [
      { account: '普通預金', sub_account: '三菱UFJ', amount: 8000, tax_category: '対象外' }
    ],
    rule_id: null,
    rule_confidence: null,
    invoice_status: 'qualified',
    invoice_number: 'T0000000000001',
    memo: null,
    memo_author: null,
    memo_target: null,
    memo_created_at: null
  },

  // 行15: 手数料通帳費、適格請求書、複数税率
  {
    id: 'j015',
    display_order: 15,
    transaction_date: '2025-02-01',
    description: '手数料通帳費',
    receipt_id: 'receipt-001',
    status: 'exported',  // 出力済み
    is_read: true,
    deleted_at: null,
    labels: ['RECEIPT', 'INVOICE_QUALIFIED', 'MULTI_TAX_RATE', 'EXPORT_EXCLUDE'],  // 出力対象外
    debit_entries: [
      { account: '消耗品費', sub_account: null, amount: 0, tax_category: '課税仕入込10%' }
    ],
    credit_entries: [
      { account: '現金', sub_account: null, amount: 0, tax_category: '対象外' }
    ],
    rule_id: null,
    rule_confidence: null,
    invoice_status: 'qualified',
    invoice_number: 'T0000000000002',
    memo: null,
    memo_author: null,
    memo_target: null,
    memo_created_at: null
  },

  // 行16: 神戸皇居鎌タクシー、ルール適用済み、適格請求書
  {
    id: 'j016',
    display_order: 16,
    transaction_date: '2025-02-02',
    description: '神戸皇居鎌タクシー',
    receipt_id: 'receipt-001',
    status: 'exported',  // 出力済み
    is_read: true,
    deleted_at: null,
    labels: ['TRANSPORT', 'RULE_APPLIED', 'INVOICE_QUALIFIED'],
    debit_entries: [
      { account: '旅費交通費', sub_account: null, amount: 800, tax_category: '課税仕入込10%' }
    ],
    credit_entries: [
      { account: '現金', sub_account: null, amount: 800, tax_category: '対象外' }
    ],
    rule_id: 'r014',
    rule_confidence: 0.96,
    invoice_status: 'qualified',
    invoice_number: 'T0000000000003',
    memo: null,
    memo_author: null,
    memo_target: null,
    memo_created_at: null
  },

  // 行17: 買取に宗鹿釜交友貴、適格請求書
  {
    id: 'j017',
    display_order: 17,
    transaction_date: '2025-02-02',
    description: '貴金に宗鹿釜交友貴',
    receipt_id: 'receipt-001',
    status: 'exported',  // 出力済み
    is_read: true,
    deleted_at: null,
    labels: ['RECEIPT', 'INVOICE_QUALIFIED'],
    debit_entries: [
      { account: '消耗品費', sub_account: null, amount: 500000, tax_category: '課税仕入込10%' }
    ],
    credit_entries: [
      { account: '普通預金', sub_account: '三菱UFJ', amount: 500000, tax_category: '対象外' }
    ],
    rule_id: null,
    rule_confidence: null,
    invoice_status: 'qualified',
    invoice_number: 'T0000000000004',
    memo: null,
    memo_author: null,
    memo_target: null,
    memo_created_at: null
  },

  // 行18: 不可分抜き回、適格請求書
  {
    id: 'j018',
    display_order: 18,
    transaction_date: '2025-02-02',
    description: '不可分抜き回',
    receipt_id: 'receipt-001',
    status: 'exported',  // 出力済み
    is_read: true,
    deleted_at: null,
    labels: ['RECEIPT', 'INVOICE_QUALIFIED'],
    debit_entries: [
      { account: '飲出羽', sub_account: null, amount: 20000, tax_category: '課税仕入込10%' }
    ],
    credit_entries: [
      { account: '現金', sub_account: null, amount: 20000, tax_category: '対象外' }
    ],
    rule_id: null,
    rule_confidence: null,
    invoice_status: 'qualified',
    invoice_number: 'T0000000000005',
    memo: null,
    memo_author: null,
    memo_target: null,
    memo_created_at: null
  },

  // 行19: 事例寿判上いは詮, 適格請求書
  {
    id: 'j019',
    display_order: 19,
    transaction_date: '2025-02-03',
    description: '事例寿判上いは詮',
    receipt_id: 'receipt-001',
    status: 'exported',  // 出力済み
    is_read: true,
    deleted_at: null,
    labels: ['RECEIPT', 'INVOICE_QUALIFIED'],
    debit_entries: [
      { account: '消耗品費', sub_account: '現金', amount: 50000, tax_category: '課税仕入込10%' }
    ],
    credit_entries: [
      { account: '普通預金', sub_account: '三菱UFJ', amount: 50000, tax_category: '対象外' }
    ],
    rule_id: null,
    rule_confidence: null,
    invoice_status: 'qualified',
    invoice_number: 'T0000000000006',
    memo: null,
    memo_author: null,
    memo_target: null,
    memo_created_at: null
  },

  // 行20: 広告宣伝費（銀行振込）、適格請求書
  {
    id: 'j020',
    display_order: 20,
    transaction_date: '2025-02-04',
    description: '広告宣伝費（銀行振込）',
    receipt_id: 'receipt-001',
    status: 'exported',  // 出力済み
    is_read: true,
    deleted_at: null,
    labels: ['BANK_STATEMENT', 'INVOICE_QUALIFIED', 'NEED_CONSULT', 'NEED_DOCUMENT'],  // 複数フラグ2
    debit_entries: [
      { account: '広告宣伝費', sub_account: '銀行', amount: 100000, tax_category: '課税仕入込10%' }
    ],
    credit_entries: [
      { account: '普通預金', sub_account: '三菱UFJ', amount: 100000, tax_category: '対象外' }
    ],
    rule_id: null,
    rule_confidence: null,
    invoice_status: 'qualified',
    invoice_number: 'T0000000000007',
    memo: null,
    memo_author: null,
    memo_target: null,
    memo_created_at: null
  },

  // 行21: 業務委託料、適格請求書（出力済み）
  {
    id: 'j021',
    display_order: 21,
    transaction_date: '2025-02-05',
    description: '業務委託料',
    receipt_id: 'receipt-001',
    status: 'exported',
    is_read: true,
    deleted_at: null,
    labels: ['RECEIPT', 'INVOICE_QUALIFIED'],
    debit_entries: [
      { account: '外注費', sub_account: null, amount: 8000, tax_category: '課税仕入込10%' }
    ],
    credit_entries: [
      { account: '普通預金', sub_account: '三菱UFJ', amount: 8000, tax_category: '対象外' }
    ],
    rule_id: null,
    rule_confidence: null,
    invoice_status: 'qualified',
    invoice_number: 'T0000000000008',
    memo: null,
    memo_author: null,
    memo_target: null,
    memo_created_at: null
  },

  // ============================================================
  // 行22-30: イエロー（未読、事故フラグ、サポート依頼）
  // ============================================================

  // 行22: OCR信頼度低、未読
  {
    id: 'j022',
    display_order: 22,
    transaction_date: '2025-02-06',
    description: '資料作成料',
    receipt_id: 'receipt-001',
    status: null,
    is_read: true,  // 既読
    deleted_at: '2026-02-21T00:00:00Z',  // ゴミ箱（検証用）
    labels: ['RECEIPT', 'OCR_LOW_CONFIDENCE'],
    debit_entries: [
      { account: '消耗品費', sub_account: null, amount: 10000, tax_category: '課税仕入込10%' }
    ],
    credit_entries: [
      { account: '現金', sub_account: null, amount: 10000, tax_category: '対象外' }
    ],
    rule_id: null,
    rule_confidence: null,
    invoice_status: null,
    invoice_number: null,
    memo: null,
    memo_author: null,
    memo_target: null,
    memo_created_at: null
  },

  // 行23: 重複疑い、未読
  {
    id: 'j023',
    display_order: 23,
    transaction_date: '2025-02-07',
    description: '不明な振り',
    receipt_id: 'receipt-001',
    status: null,
    is_read: true,  // 既読
    deleted_at: '2026-02-21T00:00:00Z',  // ゴミ箱（検証用）
    labels: ['TRANSPORT', 'DUPLICATE_SUSPECT'],
    debit_entries: [
      { account: '旅費交通費', sub_account: null, amount: 9000, tax_category: '課税仕入込10%' }
    ],
    credit_entries: [
      { account: '現金', sub_account: null, amount: 9000, tax_category: '対象外' }
    ],
    rule_id: null,
    rule_confidence: null,
    invoice_status: null,
    invoice_number: null,
    memo: null,
    memo_author: null,
    memo_target: null,
    memo_created_at: null
  },

  // 行24: 日付異常、未読
  {
    id: 'j024',
    display_order: 24,
    transaction_date: '2026-12-31',
    description: '未来日付の仕訳',
    receipt_id: 'receipt-001',
    status: null,
    is_read: false,
    deleted_at: null,
    labels: ['RECEIPT', 'DATE_ANOMALY'],
    debit_entries: [
      { account: '消耗品費', sub_account: null, amount: 11000, tax_category: '課税仕入込10%' }
    ],
    credit_entries: [
      { account: '現金', sub_account: null, amount: 11000, tax_category: '対象外' }
    ],
    rule_id: null,
    rule_confidence: null,
    invoice_status: null,
    invoice_number: null,
    memo: null,
    memo_author: null,
    memo_target: null,
    memo_created_at: null
  },

  // 行25: 金額異常、未読
  {
    id: 'j025',
    display_order: 25,
    transaction_date: '2025-02-08',
    description: '異常金額',
    receipt_id: 'receipt-001',
    status: null,
    is_read: false,
    deleted_at: null,
    labels: ['RECEIPT', 'AMOUNT_ANOMALY'],
    debit_entries: [
      { account: '消耗品費', sub_account: null, amount: 1000000, tax_category: '課税仕入込10%' }
    ],
    credit_entries: [
      { account: '現金', sub_account: null, amount: 1000000, tax_category: '対象外' }
    ],
    rule_id: null,
    rule_confidence: null,
    invoice_status: null,
    invoice_number: null,
    memo: null,
    memo_author: null,
    memo_target: null,
    memo_created_at: null
  },

  // 行26: サポート依頼（help）、メモあり、未読
  {
    id: 'j026',
    display_order: 26,
    transaction_date: '2025-02-05',
    description: '資料持ち',
    receipt_id: 'receipt-001',
    status: null,
    is_read: false,
    deleted_at: null,
    labels: ['RECEIPT', 'HAS_MEMO', 'NEED_CONSULT'],  // 旧help → 相談が必要
    debit_entries: [
      { account: '消耗品費', sub_account: null, amount: 8000, tax_category: '課税仕入込10%' }
    ],
    credit_entries: [
      { account: '現金', sub_account: null, amount: 8000, tax_category: '対象外' }
    ],
    rule_id: null,
    rule_confidence: null,
    invoice_status: null,
    invoice_number: null,
    memo: 'この仕訳が何かわかりません。助けてください。',
    memo_author: '山田太郎',
    memo_target: '佐藤花子',
    memo_created_at: '2025-02-08T10:00:00Z'
  },

  // 行27: 相談（soudan）、メモあり、未読
  {
    id: 'j027',
    display_order: 27,
    transaction_date: '2025-02-07',
    description: '材料費・調整等',
    receipt_id: 'receipt-001',
    status: null,
    is_read: false,
    deleted_at: null,
    labels: ['INVOICE', 'HAS_MEMO', 'NEED_CONSULT'],  // 旧soudan → 相談が必要
    debit_entries: [
      { account: '消耗品費', sub_account: null, amount: 11000, tax_category: '課税仕入込10%' }
    ],
    credit_entries: [
      { account: '現金', sub_account: null, amount: 11000, tax_category: '対象外' }
    ],
    rule_id: null,
    rule_confidence: null,
    invoice_status: null,
    invoice_number: null,
    memo: 'この金額で合っていますか？確認してください。',
    memo_author: '鈴木一郎',
    memo_target: '田中次郎',
    memo_created_at: '2025-02-08T14:00:00Z'
  },

  // 行28: 確認待ち（kakunin）、証憑欠落、メモあり、未読
  {
    id: 'j028',
    display_order: 28,
    transaction_date: '2025-02-08',
    description: '現金領収遅れせれ仮払い',
    receipt_id: 'receipt-001',
    status: null,
    is_read: false,
    deleted_at: null,
    labels: ['RECEIPT', 'MISSING_RECEIPT', 'HAS_MEMO', 'NEED_DOCUMENT'],  // 旧kakunin → 資料が必要
    debit_entries: [
      { account: '旅費交通費', sub_account: null, amount: 5000, tax_category: '課税仕入込10%' }
    ],
    credit_entries: [
      { account: '現金', sub_account: null, amount: 5000, tax_category: '対象外' }
    ],
    rule_id: null,
    rule_confidence: null,
    invoice_status: null,
    invoice_number: null,
    memo: '領収書が見つかりませんでした。再発行を依頼中です。',
    memo_author: '高橋美咲',
    memo_target: '伊藤健太',
    memo_created_at: '2025-02-08T15:00:00Z'
  },

  // 行29: 貸借不一致、未読
  {
    id: 'j029',
    display_order: 29,
    transaction_date: '2025-02-09',
    description: '入力ミス例',
    receipt_id: 'receipt-001',
    status: null,
    is_read: false,
    deleted_at: null,
    labels: ['RECEIPT', 'DEBIT_CREDIT_MISMATCH'],
    debit_entries: [
      { account: '消耗品費', sub_account: null, amount: 5000, tax_category: '課税仕入込10%' }
    ],
    credit_entries: [
      { account: '現金', sub_account: null, amount: 4999, tax_category: '対象外' }
    ],
    rule_id: null,
    rule_confidence: null,
    invoice_status: null,
    invoice_number: null,
    memo: null,
    memo_author: null,
    memo_target: null,
    memo_created_at: null
  },

  // 行30: 税計算誤差、未読
  {
    id: 'j030',
    display_order: 30,
    transaction_date: '2025-02-10',
    description: '計算誤差例',
    receipt_id: 'receipt-001',
    status: null,
    is_read: false,
    deleted_at: null,
    labels: ['INVOICE', 'TAX_CALCULATION_ERROR'],
    debit_entries: [
      { account: '消耗品費', sub_account: null, amount: 10000, tax_category: '課税仕入込10%' }
    ],
    credit_entries: [
      { account: '現金', sub_account: null, amount: 10001, tax_category: '対象外' }
    ],
    rule_id: null,
    rule_confidence: null,
    invoice_status: null,
    invoice_number: null,
    memo: null,
    memo_author: null,
    memo_target: null,
    memo_created_at: null
  },

  // ============================================================
  // 行31-35: 複合仕訳テストデータ（rowspan検証用）
  // ============================================================

  // 行31: 1対2複合仕訳（経費精算 → 現金+クレジットカード）
  {
    id: 'j031',
    display_order: 31,
    transaction_date: '2025-02-11',
    description: 'タクシー代（経費精算）',
    receipt_id: 'receipt-001',
    status: null,
    is_read: true,
    deleted_at: null,
    labels: ['TRANSPORT', 'RULE_APPLIED', 'INVOICE_QUALIFIED'],
    debit_entries: [
      { account: '旅費交通費', sub_account: null, amount: 5000, tax_category: '課税仕入込10%' }
    ],
    credit_entries: [
      { account: '現金', sub_account: null, amount: 3000, tax_category: '対象外' },
      { account: '未払金', sub_account: 'クレジットカード', amount: 2000, tax_category: '対象外' }
    ],
    rule_id: 'r021',
    rule_confidence: 0.88,
    invoice_status: 'qualified',
    invoice_number: 'T0000000000009',
    memo: null,
    memo_author: null,
    memo_target: null,
    memo_created_at: null
  },

  // 行32: 2対1複合仕訳（交通費+宿泊費 → クレジットカード）
  {
    id: 'j032',
    display_order: 32,
    transaction_date: '2025-02-12',
    description: '出張費用（交通費+宿泊費）',
    receipt_id: 'receipt-001',
    status: null,
    is_read: true,
    deleted_at: null,
    labels: ['CREDIT_CARD', 'INVOICE_QUALIFIED'],
    debit_entries: [
      { account: '旅費交通費', sub_account: '交通費', amount: 8000, tax_category: '課税仕入込10%' },
      { account: '旅費交通費', sub_account: '宿泊費', amount: 12000, tax_category: '課税仕入込10%' }
    ],
    credit_entries: [
      { account: '未払金', sub_account: 'クレジットカード', amount: 20000, tax_category: '対象外' }
    ],
    rule_id: null,
    rule_confidence: null,
    invoice_status: 'qualified',
    invoice_number: 'T0000000000010',
    memo: null,
    memo_author: null,
    memo_target: null,
    memo_created_at: null
  },

  // 行33: 1対3複合仕訳（給与 → 現金+社会保険料+源泉徴収税）
  {
    id: 'j033',
    display_order: 33,
    transaction_date: '2025-02-13',
    description: '給与支払（山田太郎）',
    receipt_id: 'receipt-001',
    status: null,
    is_read: true,
    deleted_at: null,
    labels: ['BANK_STATEMENT', 'INVOICE_QUALIFIED'],
    debit_entries: [
      { account: '給料手当', sub_account: null, amount: 300000, tax_category: '対象外' }
    ],
    credit_entries: [
      { account: '普通預金', sub_account: '三菱UFJ', amount: 250000, tax_category: '対象外' },
      { account: '預り金', sub_account: '社会保険料', amount: 30000, tax_category: '対象外' },
      { account: '預り金', sub_account: '源泉徴収税', amount: 20000, tax_category: '対象外' }
    ],
    rule_id: null,
    rule_confidence: null,
    invoice_status: 'qualified',
    invoice_number: 'T0000000000011',
    memo: null,
    memo_author: null,
    memo_target: null,
    memo_created_at: null
  },

  // 行34: 1対10複合仕訳（経費精算 → 10項目の内訳）
  {
    id: 'j034',
    display_order: 34,
    transaction_date: '2025-02-14',
    description: '経費精算（明細10項目）',
    receipt_id: 'receipt-001',
    status: null,
    is_read: true,
    deleted_at: null,
    labels: ['RECEIPT', 'INVOICE_QUALIFIED'],
    debit_entries: [
      { account: '経費精算', sub_account: null, amount: 55000, tax_category: '課税仕入込10%' }
    ],
    credit_entries: [
      { account: '現金', sub_account: '項目1', amount: 5000, tax_category: '対象外' },
      { account: '現金', sub_account: '項目2', amount: 5000, tax_category: '対象外' },
      { account: '現金', sub_account: '項目3', amount: 5000, tax_category: '対象外' },
      { account: '現金', sub_account: '項目4', amount: 5000, tax_category: '対象外' },
      { account: '現金', sub_account: '項目5', amount: 5000, tax_category: '対象外' },
      { account: '現金', sub_account: '項目6', amount: 5000, tax_category: '対象外' },
      { account: '現金', sub_account: '項目7', amount: 5000, tax_category: '対象外' },
      { account: '現金', sub_account: '項目8', amount: 5000, tax_category: '対象外' },
      { account: '現金', sub_account: '項目9', amount: 5000, tax_category: '対象外' },
      { account: '現金', sub_account: '項目10', amount: 5000, tax_category: '対象外' }
    ],
    rule_id: null,
    rule_confidence: null,
    invoice_status: 'qualified',
    invoice_number: 'T0000000000012',
    memo: null,
    memo_author: null,
    memo_target: null,
    memo_created_at: null
  },

  // 行35: 3対3複合仕訳（N対N、決算仕訳）
  {
    id: 'j035',
    display_order: 35,
    transaction_date: '2025-02-15',
    description: '決算仕訳（費用振替）',
    receipt_id: 'receipt-001',
    status: null,
    is_read: true,
    deleted_at: null,
    labels: ['INVOICE', 'INVOICE_QUALIFIED'],
    debit_entries: [
      { account: '売上原価', sub_account: '材料費', amount: 100000, tax_category: '課税仕入込10%' },
      { account: '売上原価', sub_account: '労務費', amount: 150000, tax_category: '対象外' },
      { account: '売上原価', sub_account: '経費', amount: 50000, tax_category: '課税仕入込10%' }
    ],
    credit_entries: [
      { account: '仕掛品', sub_account: '材料費', amount: 100000, tax_category: '対象外' },
      { account: '仕掛品', sub_account: '労務費', amount: 150000, tax_category: '対象外' },
      { account: '仕掛品', sub_account: '経費', amount: 50000, tax_category: '対象外' }
    ],
    rule_id: null,
    rule_confidence: null,
    invoice_status: 'qualified',
    invoice_number: 'T0000000000013',
    memo: null,
    memo_author: null,
    memo_target: null,
    memo_created_at: null
  }
];
