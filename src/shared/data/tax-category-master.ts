/**
 * 税区分マスタデータ（151件）
 *
 * 根拠: MF クラウド会計 税区分設定1.csv（docs/genzai/09_streamed/税区分設定1.csv）
 * 設計: domain_type_design.md v2
 *
 * ID命名ルール:
 *   共通:     COMMON_*
 *   売上:     SALES_*
 *   仕入:     PURCHASE_*
 *   輸入:     IMPORT_*
 *   簡易課税: *_T{1-6}
 *   軽減税率: *_REDUCED_*
 *   返還:     *_RETURN_*
 *   貸倒:     *_BAD_DEBT_*
 *   回収:     *_RECOVERY_*
 *
 * qualified: 適格判定対象（STREAMED help/8090の「適格判定対象」チェック相当）
 *   → 課税仕入10%, 8%, (軽)8% のみtrue（初期値）
 * aiSelectable: AI自動選択可否
 *   → STREAMED help/8369 自動判定対象のみtrue
 * active: 「使用」列が1のものtrue
 * defaultVisible: STREAMED初期設定27件 + デフォルト表示したい主要区分
 * displayOrder: CSV並び順
 */

import type { TaxCategory } from '@/shared/types/tax-category'

export const TAX_CATEGORY_MASTER: readonly TaxCategory[] = [
  // ===== 共通 =====
  { id: 'COMMON_UNKNOWN', name: '不明', shortName: '不明', direction: 'common', qualified: false, aiSelectable: false, active: true, defaultVisible: true, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 1 },
  { id: 'COMMON_EXEMPT', name: '対象外', shortName: '対象外', direction: 'common', qualified: false, aiSelectable: false, active: true, defaultVisible: true, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 2 },

  // ===== 売上: 課税売上 10% =====
  { id: 'SALES_TAXABLE_10', name: '課税売上 10%', shortName: '課売 10%', direction: 'sales', qualified: false, aiSelectable: true, active: true, defaultVisible: true, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 3 },
  { id: 'SALES_TAXABLE_10_T1', name: '課税売上 10% 一種', shortName: '課売 10% 一種', direction: 'sales', qualified: false, aiSelectable: false, active: false, defaultVisible: false, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 4 },
  { id: 'SALES_TAXABLE_10_T2', name: '課税売上 10% 二種', shortName: '課売 10% 二種', direction: 'sales', qualified: false, aiSelectable: false, active: false, defaultVisible: false, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 5 },
  { id: 'SALES_TAXABLE_10_T3', name: '課税売上 10% 三種', shortName: '課売 10% 三種', direction: 'sales', qualified: false, aiSelectable: false, active: false, defaultVisible: false, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 6 },
  { id: 'SALES_TAXABLE_10_T4', name: '課税売上 10% 四種', shortName: '課売 10% 四種', direction: 'sales', qualified: false, aiSelectable: false, active: false, defaultVisible: false, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 7 },
  { id: 'SALES_TAXABLE_10_T5', name: '課税売上 10% 五種', shortName: '課売 10% 五種', direction: 'sales', qualified: false, aiSelectable: false, active: true, defaultVisible: false, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 8 },
  { id: 'SALES_TAXABLE_10_T6', name: '課税売上 10% 六種', shortName: '課売 10% 六種', direction: 'sales', qualified: false, aiSelectable: false, active: false, defaultVisible: false, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 9 },

  // ===== 売上: 課税売上 (軽)8% =====
  { id: 'SALES_REDUCED_8', name: '課税売上 (軽)8%', shortName: '課売 (軽)8%', direction: 'sales', qualified: false, aiSelectable: true, active: true, defaultVisible: true, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 10 },
  { id: 'SALES_REDUCED_8_T1', name: '課税売上 (軽)8% 一種', shortName: '課売 (軽)8% 一種', direction: 'sales', qualified: false, aiSelectable: false, active: false, defaultVisible: false, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 11 },
  { id: 'SALES_REDUCED_8_T2', name: '課税売上 (軽)8% 二種', shortName: '課売 (軽)8% 二種', direction: 'sales', qualified: false, aiSelectable: false, active: false, defaultVisible: false, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 12 },
  { id: 'SALES_REDUCED_8_T3', name: '課税売上 (軽)8% 三種', shortName: '課売 (軽)8% 三種', direction: 'sales', qualified: false, aiSelectable: false, active: false, defaultVisible: false, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 13 },
  { id: 'SALES_REDUCED_8_T4', name: '課税売上 (軽)8% 四種', shortName: '課売 (軽)8% 四種', direction: 'sales', qualified: false, aiSelectable: false, active: false, defaultVisible: false, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 14 },
  { id: 'SALES_REDUCED_8_T5', name: '課税売上 (軽)8% 五種', shortName: '課売 (軽)8% 五種', direction: 'sales', qualified: false, aiSelectable: false, active: false, defaultVisible: false, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 15 },
  { id: 'SALES_REDUCED_8_T6', name: '課税売上 (軽)8% 六種', shortName: '課売 (軽)8% 六種', direction: 'sales', qualified: false, aiSelectable: false, active: false, defaultVisible: false, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 16 },

  // ===== 売上: 課税売上 8% =====
  { id: 'SALES_TAXABLE_8', name: '課税売上 8%', shortName: '課売 8%', direction: 'sales', qualified: false, aiSelectable: true, active: true, defaultVisible: true, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 17 },
  { id: 'SALES_TAXABLE_8_T1', name: '課税売上 8% 一種', shortName: '課売 8% 一種', direction: 'sales', qualified: false, aiSelectable: false, active: false, defaultVisible: false, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 18 },
  { id: 'SALES_TAXABLE_8_T2', name: '課税売上 8% 二種', shortName: '課売 8% 二種', direction: 'sales', qualified: false, aiSelectable: false, active: false, defaultVisible: false, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 19 },
  { id: 'SALES_TAXABLE_8_T3', name: '課税売上 8% 三種', shortName: '課売 8% 三種', direction: 'sales', qualified: false, aiSelectable: false, active: false, defaultVisible: false, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 20 },
  { id: 'SALES_TAXABLE_8_T4', name: '課税売上 8% 四種', shortName: '課売 8% 四種', direction: 'sales', qualified: false, aiSelectable: false, active: false, defaultVisible: false, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 21 },
  { id: 'SALES_TAXABLE_8_T5', name: '課税売上 8% 五種', shortName: '課売 8% 五種', direction: 'sales', qualified: false, aiSelectable: false, active: false, defaultVisible: false, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 22 },
  { id: 'SALES_TAXABLE_8_T6', name: '課税売上 8% 六種', shortName: '課売 8% 六種', direction: 'sales', qualified: false, aiSelectable: false, active: false, defaultVisible: false, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 23 },

  // ===== 売上: 課税売上 5%（旧税率） =====
  { id: 'SALES_TAXABLE_5', name: '課税売上 5%', shortName: '課売 5%', direction: 'sales', qualified: false, aiSelectable: false, active: false, defaultVisible: false, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 24 },
  { id: 'SALES_TAXABLE_5_T1', name: '課税売上 5% 一種', shortName: '課売 5% 一種', direction: 'sales', qualified: false, aiSelectable: false, active: false, defaultVisible: false, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 25 },
  { id: 'SALES_TAXABLE_5_T2', name: '課税売上 5% 二種', shortName: '課売 5% 二種', direction: 'sales', qualified: false, aiSelectable: false, active: false, defaultVisible: false, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 26 },
  { id: 'SALES_TAXABLE_5_T3', name: '課税売上 5% 三種', shortName: '課売 5% 三種', direction: 'sales', qualified: false, aiSelectable: false, active: false, defaultVisible: false, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 27 },
  { id: 'SALES_TAXABLE_5_T4', name: '課税売上 5% 四種', shortName: '課売 5% 四種', direction: 'sales', qualified: false, aiSelectable: false, active: false, defaultVisible: false, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 28 },
  { id: 'SALES_TAXABLE_5_T5', name: '課税売上 5% 五種', shortName: '課売 5% 五種', direction: 'sales', qualified: false, aiSelectable: false, active: false, defaultVisible: false, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 29 },
  { id: 'SALES_TAXABLE_5_T6', name: '課税売上 5% 六種', shortName: '課売 5% 六種', direction: 'sales', qualified: false, aiSelectable: false, active: false, defaultVisible: false, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 30 },

  // ===== 売上: 輸出・非課税・対象外 =====
  { id: 'SALES_EXPORT_0', name: '輸出売上 0%', shortName: '輸売 0%', direction: 'sales', qualified: false, aiSelectable: false, active: true, defaultVisible: true, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 31 },
  { id: 'SALES_NON_TAXABLE', name: '非課税売上', shortName: '非売', direction: 'sales', qualified: false, aiSelectable: true, active: true, defaultVisible: true, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 32 },
  { id: 'SALES_NON_TAXABLE_SECURITIES', name: '非課税売上-有価証券譲渡', shortName: '非売-有証', direction: 'sales', qualified: false, aiSelectable: false, active: true, defaultVisible: true, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 33 },
  { id: 'SALES_NON_TAXABLE_EXPORT', name: '非課税資産輸出', shortName: '非輸', direction: 'sales', qualified: false, aiSelectable: false, active: true, defaultVisible: true, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 34 },
  { id: 'SALES_EXEMPT', name: '対象外売上', shortName: '対象外売', direction: 'sales', qualified: false, aiSelectable: false, active: true, defaultVisible: true, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 35 },

  // ===== 売上: 返還 10% =====
  { id: 'SALES_RETURN_10', name: '課税売上-返還等 10%', shortName: '課売-返還 10%', direction: 'sales', qualified: false, aiSelectable: false, active: true, defaultVisible: true, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 36 },
  { id: 'SALES_RETURN_10_T1', name: '課税売上-返還等 10% 一種', shortName: '課売-返還 10% 一種', direction: 'sales', qualified: false, aiSelectable: false, active: false, defaultVisible: false, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 37 },
  { id: 'SALES_RETURN_10_T2', name: '課税売上-返還等 10% 二種', shortName: '課売-返還 10% 二種', direction: 'sales', qualified: false, aiSelectable: false, active: false, defaultVisible: false, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 38 },
  { id: 'SALES_RETURN_10_T3', name: '課税売上-返還等 10% 三種', shortName: '課売-返還 10% 三種', direction: 'sales', qualified: false, aiSelectable: false, active: false, defaultVisible: false, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 39 },
  { id: 'SALES_RETURN_10_T4', name: '課税売上-返還等 10% 四種', shortName: '課売-返還 10% 四種', direction: 'sales', qualified: false, aiSelectable: false, active: false, defaultVisible: false, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 40 },
  { id: 'SALES_RETURN_10_T5', name: '課税売上-返還等 10% 五種', shortName: '課売-返還 10% 五種', direction: 'sales', qualified: false, aiSelectable: false, active: false, defaultVisible: false, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 41 },
  { id: 'SALES_RETURN_10_T6', name: '課税売上-返還等 10% 六種', shortName: '課売-返還 10% 六種', direction: 'sales', qualified: false, aiSelectable: false, active: false, defaultVisible: false, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 42 },

  // ===== 売上: 返還 (軽)8% =====
  { id: 'SALES_RETURN_REDUCED_8', name: '課税売上-返還等 (軽)8%', shortName: '課売-返還 (軽)8%', direction: 'sales', qualified: false, aiSelectable: false, active: true, defaultVisible: true, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 43 },
  { id: 'SALES_RETURN_REDUCED_8_T1', name: '課税売上-返還等 (軽)8% 一種', shortName: '課売-返還 (軽)8% 一種', direction: 'sales', qualified: false, aiSelectable: false, active: false, defaultVisible: false, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 44 },
  { id: 'SALES_RETURN_REDUCED_8_T2', name: '課税売上-返還等 (軽)8% 二種', shortName: '課売-返還 (軽)8% 二種', direction: 'sales', qualified: false, aiSelectable: false, active: false, defaultVisible: false, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 45 },
  { id: 'SALES_RETURN_REDUCED_8_T3', name: '課税売上-返還等 (軽)8% 三種', shortName: '課売-返還 (軽)8% 三種', direction: 'sales', qualified: false, aiSelectable: false, active: false, defaultVisible: false, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 46 },
  { id: 'SALES_RETURN_REDUCED_8_T4', name: '課税売上-返還等 (軽)8% 四種', shortName: '課売-返還 (軽)8% 四種', direction: 'sales', qualified: false, aiSelectable: false, active: false, defaultVisible: false, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 47 },
  { id: 'SALES_RETURN_REDUCED_8_T5', name: '課税売上-返還等 (軽)8% 五種', shortName: '課売-返還 (軽)8% 五種', direction: 'sales', qualified: false, aiSelectable: false, active: false, defaultVisible: false, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 48 },
  { id: 'SALES_RETURN_REDUCED_8_T6', name: '課税売上-返還等 (軽)8% 六種', shortName: '課売-返還 (軽)8% 六種', direction: 'sales', qualified: false, aiSelectable: false, active: false, defaultVisible: false, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 49 },

  // ===== 売上: 返還 8% =====
  { id: 'SALES_RETURN_8', name: '課税売上-返還等 8%', shortName: '課売-返還 8%', direction: 'sales', qualified: false, aiSelectable: false, active: true, defaultVisible: true, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 50 },
  { id: 'SALES_RETURN_8_T1', name: '課税売上-返還等 8% 一種', shortName: '課売-返還 8% 一種', direction: 'sales', qualified: false, aiSelectable: false, active: false, defaultVisible: false, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 51 },
  { id: 'SALES_RETURN_8_T2', name: '課税売上-返還等 8% 二種', shortName: '課売-返還 8% 二種', direction: 'sales', qualified: false, aiSelectable: false, active: false, defaultVisible: false, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 52 },
  { id: 'SALES_RETURN_8_T3', name: '課税売上-返還等 8% 三種', shortName: '課売-返還 8% 三種', direction: 'sales', qualified: false, aiSelectable: false, active: false, defaultVisible: false, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 53 },
  { id: 'SALES_RETURN_8_T4', name: '課税売上-返還等 8% 四種', shortName: '課売-返還 8% 四種', direction: 'sales', qualified: false, aiSelectable: false, active: false, defaultVisible: false, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 54 },
  { id: 'SALES_RETURN_8_T5', name: '課税売上-返還等 8% 五種', shortName: '課売-返還 8% 五種', direction: 'sales', qualified: false, aiSelectable: false, active: false, defaultVisible: false, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 55 },
  { id: 'SALES_RETURN_8_T6', name: '課税売上-返還等 8% 六種', shortName: '課売-返還 8% 六種', direction: 'sales', qualified: false, aiSelectable: false, active: false, defaultVisible: false, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 56 },

  // ===== 売上: 返還 5%（旧税率） =====
  { id: 'SALES_RETURN_5', name: '課税売上-返還等 5%', shortName: '課売-返還 5%', direction: 'sales', qualified: false, aiSelectable: false, active: false, defaultVisible: false, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 57 },
  { id: 'SALES_RETURN_5_T1', name: '課税売上-返還等 5% 一種', shortName: '課売-返還 5% 一種', direction: 'sales', qualified: false, aiSelectable: false, active: false, defaultVisible: false, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 58 },
  { id: 'SALES_RETURN_5_T2', name: '課税売上-返還等 5% 二種', shortName: '課売-返還 5% 二種', direction: 'sales', qualified: false, aiSelectable: false, active: false, defaultVisible: false, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 59 },
  { id: 'SALES_RETURN_5_T3', name: '課税売上-返還等 5% 三種', shortName: '課売-返還 5% 三種', direction: 'sales', qualified: false, aiSelectable: false, active: false, defaultVisible: false, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 60 },
  { id: 'SALES_RETURN_5_T4', name: '課税売上-返還等 5% 四種', shortName: '課売-返還 5% 四種', direction: 'sales', qualified: false, aiSelectable: false, active: false, defaultVisible: false, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 61 },
  { id: 'SALES_RETURN_5_T5', name: '課税売上-返還等 5% 五種', shortName: '課売-返還 5% 五種', direction: 'sales', qualified: false, aiSelectable: false, active: false, defaultVisible: false, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 62 },
  { id: 'SALES_RETURN_5_T6', name: '課税売上-返還等 5% 六種', shortName: '課売-返還 5% 六種', direction: 'sales', qualified: false, aiSelectable: false, active: false, defaultVisible: false, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 63 },

  // ===== 売上: 輸出返還・非課税返還 =====
  { id: 'SALES_EXPORT_RETURN_0', name: '輸出売上-返還等 0%', shortName: '輸売-返還 0%', direction: 'sales', qualified: false, aiSelectable: false, active: true, defaultVisible: true, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 64 },
  { id: 'SALES_NON_TAXABLE_RETURN', name: '非課税売上-返還等', shortName: '非売-返還', direction: 'sales', qualified: false, aiSelectable: false, active: true, defaultVisible: true, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 65 },
  { id: 'SALES_NON_TAXABLE_EXPORT_RETURN', name: '非課税資産輸出-返還等', shortName: '非輸-返還', direction: 'sales', qualified: false, aiSelectable: false, active: true, defaultVisible: true, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 66 },

  // ===== 売上: 貸倒 =====
  { id: 'SALES_BAD_DEBT_10', name: '課税売上-貸倒 10%', shortName: '課売-貸倒 10%', direction: 'sales', qualified: false, aiSelectable: false, active: true, defaultVisible: true, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 67 },
  { id: 'SALES_BAD_DEBT_REDUCED_8', name: '課税売上-貸倒 (軽)8%', shortName: '課売-貸倒 (軽)8%', direction: 'sales', qualified: false, aiSelectable: false, active: true, defaultVisible: true, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 68 },
  { id: 'SALES_BAD_DEBT_8', name: '課税売上-貸倒 8%', shortName: '課売-貸倒 8%', direction: 'sales', qualified: false, aiSelectable: false, active: true, defaultVisible: true, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 69 },
  { id: 'SALES_BAD_DEBT_5', name: '課税売上-貸倒 5%', shortName: '課売-貸倒 5%', direction: 'sales', qualified: false, aiSelectable: false, active: false, defaultVisible: false, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 70 },
  { id: 'SALES_EXPORT_BAD_DEBT_0', name: '輸出売上-貸倒 0%', shortName: '輸売-貸倒 0%', direction: 'sales', qualified: false, aiSelectable: false, active: true, defaultVisible: true, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 71 },
  { id: 'SALES_NON_TAXABLE_BAD_DEBT', name: '非課税売上-貸倒', shortName: '非売-貸倒', direction: 'sales', qualified: false, aiSelectable: false, active: true, defaultVisible: true, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 72 },
  { id: 'SALES_NON_TAXABLE_EXPORT_BAD_DEBT', name: '非課税資産輸出-貸倒', shortName: '非輸-貸倒', direction: 'sales', qualified: false, aiSelectable: false, active: true, defaultVisible: true, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 73 },

  // ===== 売上: 貸倒回収 =====
  { id: 'SALES_RECOVERY_10', name: '課税売上-貸倒回収 10%', shortName: '課売-回収 10%', direction: 'sales', qualified: false, aiSelectable: false, active: true, defaultVisible: true, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 74 },
  { id: 'SALES_RECOVERY_REDUCED_8', name: '課税売上-貸倒回収 (軽)8%', shortName: '課売-回収 (軽)8%', direction: 'sales', qualified: false, aiSelectable: false, active: true, defaultVisible: true, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 75 },
  { id: 'SALES_RECOVERY_8', name: '課税売上-貸倒回収 8%', shortName: '課売-回収 8%', direction: 'sales', qualified: false, aiSelectable: false, active: true, defaultVisible: true, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 76 },
  { id: 'SALES_RECOVERY_5', name: '課税売上-貸倒回収 5%', shortName: '課売-回収 5%', direction: 'sales', qualified: false, aiSelectable: false, active: false, defaultVisible: false, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 77 },

  // ===== 仕入: 課税仕入 =====
  { id: 'PURCHASE_TAXABLE_10', name: '課税仕入 10%', shortName: '課仕 10%', direction: 'purchase', qualified: true, aiSelectable: true, active: true, defaultVisible: true, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 78 },
  { id: 'PURCHASE_COMMON_10', name: '共通課税仕入 10%', shortName: '共-課仕 10%', direction: 'purchase', qualified: false, aiSelectable: false, active: true, defaultVisible: true, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 79 },
  { id: 'PURCHASE_NT_10', name: '非課税対応仕入 10%', shortName: '非-課仕 10%', direction: 'purchase', qualified: false, aiSelectable: false, active: true, defaultVisible: true, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 80 },
  { id: 'PURCHASE_REDUCED_8', name: '課税仕入 (軽)8%', shortName: '課仕 (軽)8%', direction: 'purchase', qualified: true, aiSelectable: true, active: true, defaultVisible: true, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 81 },
  { id: 'PURCHASE_COMMON_REDUCED_8', name: '共通課税仕入 (軽)8%', shortName: '共-課仕 (軽)8%', direction: 'purchase', qualified: false, aiSelectable: false, active: true, defaultVisible: true, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 82 },
  { id: 'PURCHASE_NT_REDUCED_8', name: '非課税対応仕入 (軽)8%', shortName: '非-課仕 (軽)8%', direction: 'purchase', qualified: false, aiSelectable: false, active: true, defaultVisible: true, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 83 },
  { id: 'PURCHASE_TAXABLE_8', name: '課税仕入 8%', shortName: '課仕 8%', direction: 'purchase', qualified: true, aiSelectable: true, active: true, defaultVisible: true, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 84 },
  { id: 'PURCHASE_COMMON_8', name: '共通課税仕入 8%', shortName: '共-課仕 8%', direction: 'purchase', qualified: false, aiSelectable: false, active: true, defaultVisible: true, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 85 },
  { id: 'PURCHASE_NT_8', name: '非課税対応仕入 8%', shortName: '非-課仕 8%', direction: 'purchase', qualified: false, aiSelectable: false, active: true, defaultVisible: true, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 86 },
  { id: 'PURCHASE_TAXABLE_5', name: '課税仕入 5%', shortName: '課仕 5%', direction: 'purchase', qualified: false, aiSelectable: false, active: false, defaultVisible: false, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 87 },
  { id: 'PURCHASE_COMMON_5', name: '共通課税仕入 5%', shortName: '共-課仕 5%', direction: 'purchase', qualified: false, aiSelectable: false, active: false, defaultVisible: false, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 88 },
  { id: 'PURCHASE_NT_5', name: '非課税対応仕入 5%', shortName: '非-課仕 5%', direction: 'purchase', qualified: false, aiSelectable: false, active: false, defaultVisible: false, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 89 },

  // ===== 仕入: 輸入仕入 10% =====
  { id: 'IMPORT_BODY_10', name: '輸入仕入-本体 10%', shortName: '輸仕-本体 10%', direction: 'purchase', qualified: false, aiSelectable: false, active: true, defaultVisible: true, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 90 },
  { id: 'IMPORT_TAX_7_8', name: '輸入仕入-消費税額 7.8%', shortName: '輸仕-消税 7.8%', direction: 'purchase', qualified: false, aiSelectable: false, active: true, defaultVisible: true, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 91 },
  { id: 'IMPORT_LOCAL_2_2', name: '輸入仕入-地方消費税額 2.2%', shortName: '輸仕-地税 2.2%', direction: 'purchase', qualified: false, aiSelectable: false, active: true, defaultVisible: true, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 92 },
  { id: 'IMPORT_COMMON_BODY_10', name: '共通輸入仕入-本体 10%', shortName: '共-輸仕 10%', direction: 'purchase', qualified: false, aiSelectable: false, active: true, defaultVisible: false, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 93 },
  { id: 'IMPORT_COMMON_TAX_7_8', name: '共通輸入仕入-消費税額 7.8%', shortName: '共-輸仕-消税 7.8%', direction: 'purchase', qualified: false, aiSelectable: false, active: true, defaultVisible: false, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 94 },
  { id: 'IMPORT_COMMON_LOCAL_2_2', name: '共通輸入仕入-地方消費税額 2.2%', shortName: '共-輸仕-地税 2.2%', direction: 'purchase', qualified: false, aiSelectable: false, active: true, defaultVisible: false, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 95 },
  { id: 'IMPORT_NT_BODY_10', name: '非課税対応輸入-本体 10%', shortName: '非-輸仕 10%', direction: 'purchase', qualified: false, aiSelectable: false, active: true, defaultVisible: false, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 96 },
  { id: 'IMPORT_NT_TAX_7_8', name: '非課税対応輸入-消費税額 7.8%', shortName: '非-輸仕-消税 7.8%', direction: 'purchase', qualified: false, aiSelectable: false, active: true, defaultVisible: false, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 97 },
  { id: 'IMPORT_NT_LOCAL_2_2', name: '非課税対応輸入-地方消費税額 2.2%', shortName: '非-輸仕-地税 2.2%', direction: 'purchase', qualified: false, aiSelectable: false, active: true, defaultVisible: false, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 98 },

  // ===== 仕入: 輸入仕入 (軽)8% =====
  { id: 'IMPORT_BODY_REDUCED_8', name: '輸入仕入-本体 (軽)8%', shortName: '輸仕-本体 (軽)8%', direction: 'purchase', qualified: false, aiSelectable: false, active: true, defaultVisible: false, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 99 },
  { id: 'IMPORT_TAX_REDUCED_6_24', name: '輸入仕入-消費税額 (軽)6.24%', shortName: '輸仕-消税 (軽)6.24%', direction: 'purchase', qualified: false, aiSelectable: false, active: true, defaultVisible: false, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 100 },
  { id: 'IMPORT_LOCAL_REDUCED_1_76', name: '輸入仕入-地方消費税額 (軽)1.76%', shortName: '輸仕-地税 (軽)1.76%', direction: 'purchase', qualified: false, aiSelectable: false, active: true, defaultVisible: false, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 101 },
  { id: 'IMPORT_COMMON_BODY_REDUCED_8', name: '共通輸入仕入-本体 (軽)8%', shortName: '共-輸仕 (軽)8%', direction: 'purchase', qualified: false, aiSelectable: false, active: true, defaultVisible: false, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 102 },
  { id: 'IMPORT_COMMON_TAX_REDUCED_6_24', name: '共通輸入仕入-消費税額 (軽)6.24%', shortName: '共-輸仕-消税 (軽)6.24%', direction: 'purchase', qualified: false, aiSelectable: false, active: true, defaultVisible: false, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 103 },
  { id: 'IMPORT_COMMON_LOCAL_REDUCED_1_76', name: '共通輸入仕入-地方消費税額 (軽)1.76%', shortName: '共-輸仕-地税 (軽)1.76%', direction: 'purchase', qualified: false, aiSelectable: false, active: true, defaultVisible: false, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 104 },
  { id: 'IMPORT_NT_BODY_REDUCED_8', name: '非課税対応輸入-本体 (軽)8%', shortName: '非-輸仕 (軽)8%', direction: 'purchase', qualified: false, aiSelectable: false, active: true, defaultVisible: false, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 105 },
  { id: 'IMPORT_NT_TAX_REDUCED_6_24', name: '非課税対応輸入-消費税額 (軽)6.24%', shortName: '非-輸仕-消税 (軽)6.24%', direction: 'purchase', qualified: false, aiSelectable: false, active: true, defaultVisible: false, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 106 },
  { id: 'IMPORT_NT_LOCAL_REDUCED_1_76', name: '非課税対応輸入-地方消費税額 (軽)1.76%', shortName: '非-輸仕-地税 (軽)1.76%', direction: 'purchase', qualified: false, aiSelectable: false, active: true, defaultVisible: false, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 107 },

  // ===== 仕入: 輸入仕入 8% =====
  { id: 'IMPORT_BODY_8', name: '輸入仕入-本体 8%', shortName: '輸仕-本体 8%', direction: 'purchase', qualified: false, aiSelectable: false, active: true, defaultVisible: false, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 108 },
  { id: 'IMPORT_TAX_6_3', name: '輸入仕入-消費税額 6.3%', shortName: '輸仕-消税 6.3%', direction: 'purchase', qualified: false, aiSelectable: false, active: true, defaultVisible: false, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 109 },
  { id: 'IMPORT_LOCAL_1_7', name: '輸入仕入-地方消費税額 1.7%', shortName: '輸仕-地税 1.7%', direction: 'purchase', qualified: false, aiSelectable: false, active: true, defaultVisible: false, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 110 },
  { id: 'IMPORT_COMMON_BODY_8', name: '共通輸入仕入-本体 8%', shortName: '共-輸仕 8%', direction: 'purchase', qualified: false, aiSelectable: false, active: true, defaultVisible: false, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 111 },
  { id: 'IMPORT_COMMON_TAX_6_3', name: '共通輸入仕入-消費税額 6.3%', shortName: '共-輸仕-消税 6.3%', direction: 'purchase', qualified: false, aiSelectable: false, active: true, defaultVisible: false, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 112 },
  { id: 'IMPORT_COMMON_LOCAL_1_7', name: '共通輸入仕入-地方消費税額 1.7%', shortName: '共-輸仕-地税 1.7%', direction: 'purchase', qualified: false, aiSelectable: false, active: true, defaultVisible: false, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 113 },
  { id: 'IMPORT_NT_BODY_8', name: '非課税対応輸入-本体 8%', shortName: '非-輸仕 8%', direction: 'purchase', qualified: false, aiSelectable: false, active: true, defaultVisible: false, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 114 },
  { id: 'IMPORT_NT_TAX_6_3', name: '非課税対応輸入-消費税額 6.3%', shortName: '非-輸仕-消税 6.3%', direction: 'purchase', qualified: false, aiSelectable: false, active: true, defaultVisible: false, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 115 },
  { id: 'IMPORT_NT_LOCAL_1_7', name: '非課税対応輸入-地方消費税額 1.7%', shortName: '非-輸仕-地税 1.7%', direction: 'purchase', qualified: false, aiSelectable: false, active: true, defaultVisible: false, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 116 },

  // ===== 仕入: 輸入仕入 5%（旧税率） =====
  { id: 'IMPORT_BODY_5', name: '輸入仕入-本体 5%', shortName: '輸仕-本体 5%', direction: 'purchase', qualified: false, aiSelectable: false, active: false, defaultVisible: false, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 117 },
  { id: 'IMPORT_TAX_4', name: '輸入仕入-消費税額 4%', shortName: '輸仕-消税 4%', direction: 'purchase', qualified: false, aiSelectable: false, active: false, defaultVisible: false, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 118 },
  { id: 'IMPORT_LOCAL_1', name: '輸入仕入-地方消費税額 1%', shortName: '輸仕-地税 1%', direction: 'purchase', qualified: false, aiSelectable: false, active: false, defaultVisible: false, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 119 },
  { id: 'IMPORT_COMMON_BODY_5', name: '共通輸入仕入-本体 5%', shortName: '共-輸仕 5%', direction: 'purchase', qualified: false, aiSelectable: false, active: false, defaultVisible: false, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 120 },
  { id: 'IMPORT_COMMON_TAX_4', name: '共通輸入仕入-消費税額 4%', shortName: '共-輸仕-消税 4%', direction: 'purchase', qualified: false, aiSelectable: false, active: false, defaultVisible: false, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 121 },
  { id: 'IMPORT_COMMON_LOCAL_1', name: '共通輸入仕入-地方消費税額 1%', shortName: '共-輸仕-地税 1%', direction: 'purchase', qualified: false, aiSelectable: false, active: false, defaultVisible: false, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 122 },
  { id: 'IMPORT_NT_BODY_5', name: '非課税対応輸入-本体 5%', shortName: '非-輸仕 5%', direction: 'purchase', qualified: false, aiSelectable: false, active: false, defaultVisible: false, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 123 },
  { id: 'IMPORT_NT_TAX_4', name: '非課税対応輸入-消費税額 4%', shortName: '非-輸仕-消税 4%', direction: 'purchase', qualified: false, aiSelectable: false, active: false, defaultVisible: false, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 124 },
  { id: 'IMPORT_NT_LOCAL_1', name: '非課税対応輸入-地方消費税額 1%', shortName: '非-輸仕-地税 1%', direction: 'purchase', qualified: false, aiSelectable: false, active: false, defaultVisible: false, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 125 },

  // ===== 仕入: 特定課税仕入 =====
  { id: 'PURCHASE_SPECIFIC_10', name: '特定課税仕入 10%', shortName: '特定課仕 10%', direction: 'purchase', qualified: false, aiSelectable: false, active: false, defaultVisible: false, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 126 },
  { id: 'PURCHASE_SPECIFIC_COMMON_10', name: '共通特定課税仕入 10%', shortName: '共-特定課仕 10%', direction: 'purchase', qualified: false, aiSelectable: false, active: false, defaultVisible: false, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 127 },
  { id: 'PURCHASE_SPECIFIC_NT_10', name: '非課税対応特定課税仕入 10%', shortName: '非-特定課仕 10%', direction: 'purchase', qualified: false, aiSelectable: false, active: false, defaultVisible: false, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 128 },
  { id: 'PURCHASE_SPECIFIC_8', name: '特定課税仕入 8%', shortName: '特定課仕 8%', direction: 'purchase', qualified: false, aiSelectable: false, active: false, defaultVisible: false, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 129 },
  { id: 'PURCHASE_SPECIFIC_COMMON_8', name: '共通特定課税仕入 8%', shortName: '共-特定課仕 8%', direction: 'purchase', qualified: false, aiSelectable: false, active: false, defaultVisible: false, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 130 },
  { id: 'PURCHASE_SPECIFIC_NT_8', name: '非課税対応特定課税仕入 8%', shortName: '非-特定課仕 8%', direction: 'purchase', qualified: false, aiSelectable: false, active: false, defaultVisible: false, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 131 },

  // ===== 仕入: 非課税・対象外 =====
  { id: 'PURCHASE_NON_TAXABLE', name: '非課税仕入', shortName: '非仕', direction: 'purchase', qualified: false, aiSelectable: true, active: true, defaultVisible: true, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 132 },
  { id: 'PURCHASE_EXEMPT', name: '対象外仕入', shortName: '対象外仕', direction: 'purchase', qualified: false, aiSelectable: false, active: true, defaultVisible: true, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 133 },

  // ===== 仕入: 返還 10% =====
  { id: 'PURCHASE_RETURN_10', name: '課税仕入-返還等 10%', shortName: '課仕-返還 10%', direction: 'purchase', qualified: false, aiSelectable: false, active: true, defaultVisible: true, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 134 },
  { id: 'PURCHASE_RETURN_COMMON_10', name: '共通課税仕入-返還等 10%', shortName: '共-課仕-返還 10%', direction: 'purchase', qualified: false, aiSelectable: false, active: true, defaultVisible: false, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 135 },
  { id: 'PURCHASE_RETURN_NT_10', name: '非課税対応仕入-返還等 10%', shortName: '非-課仕-返還 10%', direction: 'purchase', qualified: false, aiSelectable: false, active: true, defaultVisible: false, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 136 },

  // ===== 仕入: 返還 (軽)8% =====
  { id: 'PURCHASE_RETURN_REDUCED_8', name: '課税仕入-返還等 (軽)8%', shortName: '課仕-返還 (軽)8%', direction: 'purchase', qualified: false, aiSelectable: false, active: true, defaultVisible: true, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 137 },
  { id: 'PURCHASE_RETURN_COMMON_REDUCED_8', name: '共通課税仕入-返還等 (軽)8%', shortName: '共-課仕-返還 (軽)8%', direction: 'purchase', qualified: false, aiSelectable: false, active: true, defaultVisible: false, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 138 },
  { id: 'PURCHASE_RETURN_NT_REDUCED_8', name: '非課税対応仕入-返還等 (軽)8%', shortName: '非-課仕-返還 (軽)8%', direction: 'purchase', qualified: false, aiSelectable: false, active: true, defaultVisible: false, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 139 },

  // ===== 仕入: 返還 8% =====
  { id: 'PURCHASE_RETURN_8', name: '課税仕入-返還等 8%', shortName: '課仕-返還 8%', direction: 'purchase', qualified: false, aiSelectable: false, active: true, defaultVisible: true, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 140 },
  { id: 'PURCHASE_RETURN_COMMON_8', name: '共通課税仕入-返還等 8%', shortName: '共-課仕-返還 8%', direction: 'purchase', qualified: false, aiSelectable: false, active: true, defaultVisible: false, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 141 },
  { id: 'PURCHASE_RETURN_NT_8', name: '非課税対応仕入-返還等 8%', shortName: '非-課仕-返還 8%', direction: 'purchase', qualified: false, aiSelectable: false, active: true, defaultVisible: false, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 142 },

  // ===== 仕入: 返還 5%（旧税率） =====
  { id: 'PURCHASE_RETURN_5', name: '課税仕入-返還等 5%', shortName: '課仕-返還 5%', direction: 'purchase', qualified: false, aiSelectable: false, active: false, defaultVisible: false, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 143 },
  { id: 'PURCHASE_RETURN_COMMON_5', name: '共通課税仕入-返還等 5%', shortName: '共-課仕-返還 5%', direction: 'purchase', qualified: false, aiSelectable: false, active: false, defaultVisible: false, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 144 },
  { id: 'PURCHASE_RETURN_NT_5', name: '非課税対応仕入-返還等 5%', shortName: '非-課仕-返還 5%', direction: 'purchase', qualified: false, aiSelectable: false, active: false, defaultVisible: false, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 145 },

  // ===== 仕入: 特定課税仕入-返還 =====
  { id: 'PURCHASE_SPECIFIC_RETURN_10', name: '特定課税仕入-返還等 10%', shortName: '特定課仕-返還 10%', direction: 'purchase', qualified: false, aiSelectable: false, active: false, defaultVisible: false, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 146 },
  { id: 'PURCHASE_SPECIFIC_RETURN_COMMON_10', name: '共通特定課税仕入-返還等 10%', shortName: '共-特定課仕-返還 10%', direction: 'purchase', qualified: false, aiSelectable: false, active: false, defaultVisible: false, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 147 },
  { id: 'PURCHASE_SPECIFIC_RETURN_NT_10', name: '非課税対応特定課税仕入-返還等 10%', shortName: '非-特定課仕-返還 10%', direction: 'purchase', qualified: false, aiSelectable: false, active: false, defaultVisible: false, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 148 },
  { id: 'PURCHASE_SPECIFIC_RETURN_8', name: '特定課税仕入-返還等 8%', shortName: '特定課仕-返還 8%', direction: 'purchase', qualified: false, aiSelectable: false, active: false, defaultVisible: false, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 149 },
  { id: 'PURCHASE_SPECIFIC_RETURN_COMMON_8', name: '共通特定課税仕入-返還等 8%', shortName: '共-特定課仕-返還 8%', direction: 'purchase', qualified: false, aiSelectable: false, active: false, defaultVisible: false, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 150 },
  { id: 'PURCHASE_SPECIFIC_RETURN_NT_8', name: '非課税対応特定課税仕入-返還等 8%', shortName: '非-特定課仕-返還 8%', direction: 'purchase', qualified: false, aiSelectable: false, active: false, defaultVisible: false, deprecated: false, effectiveFrom: '2019-10-01', effectiveTo: null, displayOrder: 151 },
] as const
